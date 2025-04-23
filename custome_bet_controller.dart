import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:nb_utils/nb_utils.dart';
import '../../../../app/data/local/my_shared_pref.dart';
import '../../../../app/data/models/response/bet_log_model.dart';
import '../../../../app/modules/dashboard_screen/controllers/dashboard_screen_controller.dart';
import '../../../../app/routes/app_pages.dart';
import '../../../../app/services/base_client.dart';
import '../../../../utils/constants.dart';
import '../../../../utils/default_dialogue_widget.dart';
import '../../cricket_list_new/controller/fancy_mapping_controller.dart';
import '../../custom_bet/model/bet_card_model.dart';
import '../../custom_bet/model/bookmaker_response.dart';
import '../../custom_bet/model/fancy_odds_response.dart';
import '../../custom_bet/model/match_odds_response.dart';
import '../../custom_bet/model/question_model.dart';
import '../../custom_bet/model/question_option_model.dart';

class OptimizedCustomBetController extends GetxController {
  // Add disposed flag
  bool _isDisposed = false;

  // Make stream controllers nullable
  StreamController<Question>? _matchOddsSubject;
  StreamController<Question>? _bookmakerSubject;
  StreamController<Question>? _fancySubject;
  BetLogModel betLogModel = BetLogModel();
  // static Map<String, Map<String, String>> _betMaps = {};

  // static final
  final RxMap<String, Map<String, String?>> _betMaps =
      <String, Map<String, String?>>{}.obs;

  // Add a method to update the static map

  void updateBetMaps(Map<String, Map<String, String?>> newData) {
    _betMaps.value = newData;
    update();
  }

  // Observable values
  final matchOdds = Rx<Question?>(null);
  final bookmaker = Rx<Question?>(null);
  final fancy = Rx<Question?>(null);
  late final FancyMappingController mapping_controller;
  late final String marketId;
  late final String eventId;
  Question? _lastFancyData;
  Timer? _updateTimer;
  bool _isProcessing = false;
  final showVideoPlayer = false.obs;

  @override
  void onInit() {
    if (!Get.isRegistered<FancyMappingController>()) {
      Get.put(FancyMappingController());
    }
    mapping_controller = Get.find<FancyMappingController>();
    _isDisposed = false;

    _initializeStreams();

    final args = Get.arguments as Map<String, dynamic>;
    marketId = args['marketId'] ?? '';
    eventId = args['eventId'] ?? '';
    super.onInit();
    setupDataStream();
    fetchMappings();
    getBets();
  }

  void fetchMappings() async {
    print('fetching mappings');
    await mapping_controller.initialize(eventId: eventId, marketId: marketId);

    // Set up periodic mapping refresh every 10 minutes
    Timer.periodic(const Duration(seconds: 30), (timer) async {
      print('refreshing mappings');
      await mapping_controller.initialize(eventId: eventId, marketId: marketId);
    });
  }

  void toggleVideoPlayer() {
    showVideoPlayer.value = !showVideoPlayer.value;
  }

  void _initializeStreams() {
    _matchOddsSubject = StreamController<Question>.broadcast();
    _bookmakerSubject = StreamController<Question>.broadcast();
    _fancySubject = StreamController<Question>.broadcast();
  }

  String? _getEndpoint(String type) {
    const baseUrl = 'https://test.book2500.in';

    switch (type) {
      case 'match':
        return '$baseUrl/fetch-event-odds/$eventId/$marketId';
      case 'bookmaker':
        return '$baseUrl/fetch-bookmaker-odds/$eventId/$marketId';
      case 'fancy':
        return '$baseUrl/fetch-fancy-odds/$eventId/$marketId';
      default:
        return null;
    }
  }

  void setupDataStream() {
    _updateTimer?.cancel();
    _updateTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (!_isProcessing && !_isDisposed) {
        _isProcessing = true;
        _fetchOddsParallel();
      }
    });

    // Use broadcast streams more efficiently
    _matchOddsSubject?.stream
        .distinct()
        .where((_) => !_isDisposed)
        .listen((data) => matchOdds.value = data);
    _bookmakerSubject?.stream
        .distinct()
        .where((_) => !_isDisposed)
        .listen((data) => bookmaker.value = data);
    _fancySubject?.stream
        .distinct()
        .where((_) => !_isDisposed)
        .listen((data) => fancy.value = data);
  }

  Future<void> _fetchOddsParallel() async {
    try {
      await Future.wait([
        _fetchOddsType('match'),
        _fetchOddsType('bookmaker'),
        _fetchOddsType('fancy'),
      ], eagerError: false);
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> _fetchOddsType(String type) async {
    if (_isDisposed) return;

    final endpoint = _getEndpoint(type);
    if (endpoint == null) return;

    try {
      final response = await http.get(
        Uri.parse(endpoint),
        headers: {},
      ).timeout(const Duration(milliseconds: 5000)); // Reduced timeout

      if (_isDisposed) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;

        switch (type) {
          case 'match':
            if (!_isDisposed &&
                _matchOddsSubject != null &&
                !_matchOddsSubject!.isClosed) {
              final result =
                  _parseMatchOdds(data); // Direct call instead of compute
              if (!_isDisposed && !_matchOddsSubject!.isClosed) {
                _matchOddsSubject?.add(result);
              }
            }
         
            break;
          case 'bookmaker':
            if (!_isDisposed &&
                _bookmakerSubject != null &&
                !_bookmakerSubject!.isClosed) {
              unawaited(compute(_parseBookmakerOdds, data).then((result) {
                if (!_isDisposed && !_bookmakerSubject!.isClosed) {
                  _bookmakerSubject?.add(result);
                }
              }));
            }
            break;
          case 'fancy':
            if (!_isDisposed &&
                _fancySubject != null &&
                !_fancySubject!.isClosed) {
              unawaited(compute(_parseFancyOdds, data).then((result) {
                if (!_isDisposed &&
                    !_fancySubject!.isClosed &&
                    _shouldUpdateFancy(result)) {
                  _lastFancyData = result;
                  _fancySubject?.add(result);
                }
              }));
            }
            break;
        }
      }
    } catch (e) {
      debugPrint('$type odds fetch error: $e');
    }
  }

  static Question _parseFancyOdds(Map<String, dynamic> data) {
    final response = FancyOddsResponse.fromJson(data);
    return Question(
      title: 'FANCY',
      minBet: 100,
      maxBet: 250000,
      backHeader: 'YES',
      layHeader: 'NO',
      options: response.data
          .map((odd) => QuestionOption(
                // currentBet: _betMaps[odd.selectionId.toString()]?['return'],
                status: odd.gameStatus,
                isActive: odd.gameStatus.isEmpty,
                selectionId: odd.selectionId,
                teamName: odd.runnerName,
                showStarLeading: true,
                min: odd.min?.toInt() ?? 100,
                max: odd.max?.toInt() ?? 250000,
                subtitle:
                    'Min: ${odd.min.toStringAsFixed(0)} | Max: ${odd.max.toStringAsFixed(0)}',
                backBet: BetCardModel(
                  level: 0,
                  odds: odd.backPrice1.round().toString(),
                  stake: odd.backSize1.round().toString(),
                  isBack: true,
                  isSuspended: odd.gameStatus.isNotEmpty,
                ),
                layBet: BetCardModel(
                  level: 0,
                  odds: odd.backPrice1.round().toString(),
                  stake: odd.backSize1.round().toString(),
                  isBack: false,
                  isSuspended: odd.gameStatus.isNotEmpty,
                ),
              ))
          .toList(),
    );
  }

  bool _shouldUpdateFancy(Question newData) {
    if (_lastFancyData == null) return true;

    // Compare essential data only
    final oldOptions = _lastFancyData!.options;
    final newOptions = newData.options;

    if (oldOptions.length != newOptions.length) return true;

    for (var i = 0; i < oldOptions.length; i++) {
      if (oldOptions[i].backBet?.odds != newOptions[i].backBet?.odds ||
          oldOptions[i].layBet?.odds != newOptions[i].layBet?.odds ||
          oldOptions[i].teamName != newOptions[i].teamName) {
        return true;
      }
    }
    return false;
  }

  Question _parseMatchOdds(Map<String, dynamic> data) {
    final response = MatchOddsResponse.fromJson(data);

    final Runner? runnerExt = response.data.runners
        .where((e) => _betMaps[e.selectionId.toString()] != null)
        .firstOrNull;
    bool isBetting = false;
    if (runnerExt != null) {
      isBetting = true;
    }
    String? betAmount;
    if (runnerExt != null) {
      betAmount = _betMaps[runnerExt.selectionId.toString()]?['amount'];
    }

    print(
        'betodds of lgs is $betAmount and isbetting is $isBetting and runnerExt is $runnerExt and runnerExt is ${runnerExt?.selectionId}');

    return Question(
      status: response.data.status,
      inplay: response.data.inplay,
      title: 'MATCH ODDS',
      minBet: double.tryParse(response.data.min)?.toInt() ?? 100,
      maxBet: double.tryParse(response.data.max)?.toInt() ?? 250000,
      backHeader: 'BACK',
      layHeader: 'LAY',
      options: response.data.runners.map((runner) {
        final backs = runner.back;
        final lays = runner.lay;

        return QuestionOption(
          currentBet: (runnerExt != null &&
                  runnerExt.selectionId.toString() ==
                      runner.selectionId.toString())
              ? _betMaps?[runnerExt.selectionId.toString()]?['return']
              : betAmount,
          status: runner.status,
          selectionId: runner.selectionId.toString(),
          teamName: runner.runner,
          isActive: runner.status == 'ACTIVE',
          backBet: BetCardModel(
            level: 0,
            odds: backs[0].price.toString(),
            stake: backs[0].size.toString(),
            isBack: true,
            isSuspended: runner.status != 'ACTIVE',
          ),
          backBet2: backs.length > 1
              ? BetCardModel(
                  level: 1,
                  odds: backs[1].price.toString(),
                  stake: backs[1].size.toString(),
                  isBack: true,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
          backBet3: backs.length > 2
              ? BetCardModel(
                  level: 2,
                  odds: backs[2].price.toString(),
                  stake: backs[2].size.toString(),
                  isBack: true,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
          layBet: BetCardModel(
            level: 0,
            odds: lays[0].price.toString(),
            stake: lays[0].size.toString(),
            isBack: false,
            isSuspended: runner.status != 'ACTIVE',
          ),
          layBet2: lays.length > 1
              ? BetCardModel(
                  level: 1,
                  odds: lays[1].price.toString(),
                  stake: lays[1].size.toString(),
                  isBack: false,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
          layBet3: lays.length > 2
              ? BetCardModel(
                  level: 2,
                  odds: lays[2].price.toString(),
                  stake: lays[2].size.toString(),
                  isBack: false,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
        );
      }).toList(),
    );
  }

  Question _parseBookmakerOdds(Map<String, dynamic> data) {
    final response = BookmakerResponse.fromJson(data);
    final BookmakerRunner? runnerExt = response.data.runners
        .where((e) => _betMaps[e.selectionId.toString()] != null)
        .firstOrNull;
    bool isBetting = false;
    if (runnerExt != null) {
      isBetting = true;
    }
    String? betAmount;
    if (runnerExt != null) {
      betAmount = _betMaps[runnerExt.selectionId.toString()]?['amount'];
    }

    print(
        'betodds of lgs is $betAmount and isbetting is $isBetting and runnerExt is $runnerExt and runnerExt is ${runnerExt?.selectionId}');
    return Question(
      status: response.data.status,
      inplay: response.data.inplay,
      title: 'BOOKMAKER',
      minBet: double.tryParse(response.data.min)?.toInt() ?? 100,
      maxBet: double.tryParse(response.data.max)?.toInt() ?? 250000,
      backHeader: 'BACK',
      layHeader: 'LAY',
      options: response.data.runners.map((runner) {
        final backs = runner.back;
        final lays = runner.lay;

        return QuestionOption(
          status: runner.status,
          isActive: runner.status == 'ACTIVE',
          selectionId: runner.selectionId.toString(),
          currentBet: (runnerExt != null &&
                  runnerExt.selectionId.toString() ==
                      runner.selectionId.toString())
              ? _betMaps?[runnerExt.selectionId.toString()]?['return']
              : betAmount,
          // currentBet: _betMaps[runner.selectionId.toString()]?['return'],
          slidingText: response.data.rem,
          teamName: runner.runnerName,
          backBet: BetCardModel(
            level: 0,
            odds: backs[0].price.toString(),
            stake: backs[0].size,
            isBack: true,
            isSuspended: runner.status != 'ACTIVE',
          ),
          backBet2: backs.length > 1
              ? BetCardModel(
                  level: 1,
                  odds: backs[1].price.toString(),
                  stake: backs[1].size,
                  isBack: true,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
          backBet3: backs.length > 2
              ? BetCardModel(
                  level: 2,
                  odds: backs[2].price.toString(),
                  stake: backs[2].size,
                  isBack: true,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
          layBet: BetCardModel(
            level: 0,
            odds: lays[0].price.toString(),
            stake: lays[0].size,
            isBack: false,
            isSuspended: runner.status != 'ACTIVE',
          ),
          layBet2: lays.length > 1
              ? BetCardModel(
                  level: 1,
                  odds: lays[1].price.toString(),
                  stake: lays[1].size,
                  isBack: false,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
          layBet3: lays.length > 2
              ? BetCardModel(
                  level: 2,
                  odds: lays[2].price.toString(),
                  stake: lays[2].size,
                  isBack: false,
                  isSuspended: runner.status != 'ACTIVE',
                )
              : null,
        );
      }).toList(),
    );
  }

  Future<void> sendPrediction(
    String selectionId,
    double odds,
    double stake,
    String type,
    int level,
    bool isBack,
  ) async {
    String token = MySharedPref.getData('token') ?? '';

    // Show progress snackbar
    Get.snackbar(
      'Placing Bet',
      'Please wait while we process your bet...',
      showProgressIndicator: true,
      progressIndicatorBackgroundColor: Colors.white,
      snackPosition: SnackPosition.TOP,
      backgroundColor: Colors.black54,
      colorText: Colors.white,
      duration: const Duration(seconds: 30),
    );
    Map<String, dynamic> body;
    if (type == 'fancy-odds') {
      final mapped = mapping_controller.getBySelectionIdAndOptionName(
          selectionId, isBack ? 'Back' : 'Lay');
      body = {
        'market_id': marketId, //string
        'event_id': eventId, //string
        // 'game_id': '4', //string
        'invest_amount': stake, //double
        "RunnerName": mapped?.first.runnerName,
        "match_id": mapped?.first.matchId,
        "betquestion_id": mapped?.first.questionId,
        "betoption_id": mapped?.first.optionId,
        "Option_name": mapped?.first.optionName,
        'ratio': odds.toString(), //double
        'selection_id': selectionId, //string
        'type': type, //string
        'isback': isBack ? 1 : 0,
        'is_back': isBack, //bool
        'level': level //int,
        //fixed
        // ,
        // "betoption_id": 1153,
        // "betquestion_id": 1144,
        // "match_id": 917
      };
    } else if (type == 'bookmaker-odds') {
      final mapped = mapping_controller.getBookmakerBySelectionId(selectionId);
      body = {
        'market_id': marketId, //string
        'event_id': eventId, //string
        // 'game_id': '4', //string
        'invest_amount': stake, //double
        "RunnerName": mapped?.runnerName,
        "match_id": mapped?.matchId,
        "betquestion_id": mapped?.questionId,
        "betoption_id": mapped?.optionId,
        "Option_name": mapped?.optionName,
        'ratio': odds.toString(), //double
        'selection_id': selectionId, //string
        'type': type, //string
        'is_back': isBack, //bool
        'isback': isBack ? 1 : 0,
        'level': level //int,
        , //fixed

        // "betoption_id": 1153,
        // "betquestion_id": 1144,
        // "match_id": 917
      };
    } else {
      final mapped = mapping_controller.getMatchBySelectionId(selectionId);
      body = {
        'market_id': marketId, //string
        'event_id': eventId, //string
        // 'game_id': '4', //string
        'invest_amount': stake, //double
        "RunnerName": mapped?.runnerName,
        "match_id": mapped?.matchId,
        "betquestion_id": mapped?.questionId,
        "betoption_id": mapped?.optionId,
        "Option_name": mapped?.optionName,
        'ratio': odds.toString(), //double
        'selection_id': selectionId, //string
        'type': type, //string
        'is_back': isBack, //bool
        'isback': isBack ? 1 : 0,
        'level': level //int
      };
    }
    print('sending prediction ....');
    print('sending prediction $body');
    await BaseClient.safeApiCall(
      'https://book2500.funzip.in/api/prediction',
      // 'https://webhook.site/b75b69b2-4fd2-49c9-9b57-ada0c5b8a440',
      RequestType.post,
      headers: {'Authorization': 'Bearer $token'},
      data: body,
      onLoading: () => update(),
      onSuccess: (response) {
        // Close the progress snackbar
        Get.closeAllSnackbars();

        print('bet response ${response.data}');

        if (response.data['success'] == true) {
          showCustomDialogue(
              title: 'Congratulations!',
              description: 'Your bet has been placed successfully',
              icon: Icons.check_circle,
              onPressed: () => Get.back(),
              buttonText: 'Place another Bet');
        } else {
          showCustomDialogue(
              title: 'Unable to set Bet',
              description:
                  response.data['message'] ?? 'Please refresh and try again',
              icon: Icons.cancel,
              onPressed: () {
                Get.back();
                final homeLogic = Get.find<DashboardScreenController>();
                homeLogic.getData();
                Get.toNamed(Routes.HOME);
              },
              buttonText: 'Try again');
        }
        update();
        print('Fetching bets...');
        getBets();
        update();
      },
      onError: (error) {
        // Close the progress snackbar
        Get.closeAllSnackbars();
        showCustomDialogue(
            title: 'Unable to set Bet',
            description: 'Please refresh and try again',
            icon: Icons.cancel,
            onPressed: () {
              Get.back();
              final homeLogic = Get.find<DashboardScreenController>();
              homeLogic.getData();
              Get.toNamed(Routes.HOME);
            },
            buttonText: 'Try again');

        // BaseClient.handleApiError(error);
        update();
      },
    );
  }

  Future<void> sendCashout(
    String type,
    Question question, [
    String? selectionId,
  ]) async {
    try {
      print('sending method cashout....$selectionId and type $type');

      // Get latest bet info first
      String? matchId;
      int? questionId;
      if (type == 'bookmaker-odds') {
        matchId = mapping_controller.bookmakerMappings.first.matchId;
        questionId = mapping_controller.bookmakerMappings.first.questionId;
      } else if (type == 'fancy-odds') {
        matchId = mapping_controller.mappings.first.matchId;
      } else {
        matchId = mapping_controller.matchMappings.first.matchId;
        questionId = mapping_controller.matchMappings.first.questionId;
      }

      final pendingBets = betLogModel.logs
              ?.where((log) =>
                  log.matchId == matchId && log.status?.toLowerCase() == '0')
              .toList() ??
          [];

      if (pendingBets.isEmpty) {
        showCustomDialogue(
            title: 'No Pending Bets',
            description: 'You have no pending bets to cashout for this match',
            icon: Icons.cancel,
            onPressed: () => Get.back(),
            buttonText: 'Continue');
        return;
      }

      final latestBet = pendingBets.first;
      final otherOptionOdd = getOtherOdd(type, latestBet.betquestionId!,
          latestBet.betoptionId!, latestBet.level!);
      final currentOptionOdd = getCurrentOdd(type, latestBet.betquestionId!,
          latestBet.betoptionId!, latestBet.level!);

      
      final confirmed = await Get.dialog<bool>(
        AlertDialog(
          backgroundColor: Colors.grey[900],
          title: const Row(
            children: [
              Icon(Icons.monetization_on, color: Colors.amber),
              SizedBox(width: 10),
              Text(
                'Confirm Cashout',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Invested Amount: ₹${latestBet.investAmount}',
                style: const TextStyle(color: Colors.white),
              ),
              Text(
                'Original Odds: ${latestBet.ratio}',
                style: const TextStyle(color: Colors.white),
              ),
              Text(
                'Current Market Odds: $currentOptionOdd',
                style: const TextStyle(color: Colors.white),
              ),
              Text(
                'Other Option Odds: $otherOptionOdd',
                style: const TextStyle(color: Colors.white),
              ),
              Text(
                'Cashout amount : ₹${(double.parse(latestBet.returnAmount.toString()) * 0.9).toStringAsFixed(2)}',
                style: const TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Do you want to proceed with the cashout?',
                style: TextStyle(color: Colors.white70),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Get.back(result: false),
              child: const Text(
                'Cancel',
                style: TextStyle(color: Colors.amber),
              ),
            ),
            TextButton(
              onPressed: () => Get.back(result: true),
              child: const Text(
                'Confirm',
                style: TextStyle(color: Colors.amber),
              ),
            ),
          ],
        ),
      );
      if (confirmed == true) {
        await _executeCashout(
          type: type,
          question: question,
          latestBet: latestBet,
          matchId: matchId!,
          questionId: questionId,
          currentOptionOdd: currentOptionOdd,
          otherOptionOdd: otherOptionOdd,
        );
      }
    } catch (e) {
      print('cashout error $e');
      showCustomDialogue(
          title: 'Unable to cashout',
          description: 'Try again',
          icon: Icons.cancel,
          onPressed: () => Get.back(),
          buttonText: 'Continue');
    }
  }

  Future<void> _executeCashout({
    required String type,
    required Question question,
    required Logs latestBet,
    required String matchId,
    int? questionId,
    required String currentOptionOdd,
    required String otherOptionOdd,
  }) async {
    Get.snackbar(
      'Cash out processing',
      'Please wait while we cashout your bets...',
      showProgressIndicator: true,
      progressIndicatorBackgroundColor: Colors.white,
      snackPosition: SnackPosition.TOP,
      backgroundColor: Colors.black54,
      colorText: Colors.white,
      duration: const Duration(seconds: 30),
    );

    String token = MySharedPref.getData('token') ?? '';

    try {
      final response = await BaseClient.safeApiCall(
        'https://book2500.funzip.in/api/cashout',
        RequestType.post,
        headers: {'Authorization': 'Bearer $token'},
        data: {
          'bet_invest_id': latestBet.id,
          'match_id': matchId,
          'question_id': questionId,
          'base0': currentOptionOdd,
          'base1': otherOptionOdd,
          'type': type,
        },
        onSuccess: (response) {
          Get.closeAllSnackbars();
          if (response.data['success'] == true) {
            final message = response.data['message'] as String?;
            final refundAmount = response.data['refund_amount'] as num?;
            final newBalance = response.data['new_balance'] as num?;

            String description = 'Cashout successful';
            if (message != null) description = message;
            if (refundAmount != null) {
              description +=
                  '\nRefund Amount: ₹${refundAmount.toStringAsFixed(2)}';
            }
            if (newBalance != null) {
              description += '\nNew Balance: ₹${newBalance.toStringAsFixed(2)}';
            }

            showCustomDialogue(
                title: 'Success!',
                description: description,
                icon: Icons.check_circle,
                onPressed: () => Get.back(),
                buttonText: 'Continue');

            getBets();
          } else {
            showCustomDialogue(
                title: 'Unable to Cashout',
                description: response.data['message'] ?? 'Please try again',
                icon: Icons.cancel,
                onPressed: () {
                  Get.back();
                  // final homeLogic = Get.find<DashboardScreenController>();
                  // homeLogic.getData();
                  // Get.toNamed(Routes.HOME);
                },
                buttonText: 'Try again');
          }
        },
        onError: (error) {
          Get.closeAllSnackbars();
          showCustomDialogue(
              title: 'Unable to Cashout',
              description: 'An error occurred during cashout',
              icon: Icons.cancel,
              onPressed: () => Get.back(),
              buttonText: 'Continue');
        },
      );
    } catch (e) {
      Get.closeAllSnackbars();
      showCustomDialogue(
          title: 'Error',
          description: 'Failed to process cashout',
          icon: Icons.error,
          onPressed: () => Get.back(),
          buttonText: 'OK');
    }
  }

  String getOtherOdd(
      String type, final String questionId, final String optionId, int level) {
    String otherOdd = '0.0';

    if (type == 'event-odds') {
      final otherOptionSelectionId = mapping_controller.matchMappings
          .where((m) =>
              m.questionId.toString() == questionId &&
              m.optionId.toString() != optionId)
          .first
          .selectionId;
      if (otherOptionSelectionId != null) {
        final option = matchOdds.value?.options
            .where((m) => m.selectionId == otherOptionSelectionId)
            .first;
        switch (level) {
          case 0:
            otherOdd = option!.backBet.odds;
            break;
          case 1:
            otherOdd = option?.backBet2?.odds ?? '0.0';
            break;
          case 2:
            otherOdd = option?.backBet3?.odds ?? '0.0';
            break;
          default:
            otherOdd = option!.backBet.odds;
        }
      }
    } else if (type == 'bookmaker-odds') {
      final otherOptionSelectionId = mapping_controller.bookmakerMappings
          .where((m) =>
              m.questionId.toString() == questionId &&
              m.optionId.toString() != optionId)
          .first
          .selectionId;
      if (otherOptionSelectionId != null) {
        final option = bookmaker.value?.options
            .where((m) => m.selectionId == otherOptionSelectionId)
            .first;
        switch (level) {
          case 0:
            otherOdd = option!.backBet.odds;
            break;
          case 1:
            otherOdd = option?.backBet2?.odds ?? '0.0';
            break;
          case 2:
            otherOdd = option?.backBet3?.odds ?? '0.0';
            break;
          default:
            otherOdd = option!.backBet.odds;
        }
      }
    }
    return otherOdd;
  }

  String getCurrentOdd(
      String type, final String questionId, final String optionId, int level) {
    String otherOdd = '0.0';

    if (type == 'event-odds') {
      final otherOptionSelectionId = mapping_controller.matchMappings
          .where((m) =>
              m.questionId.toString() == questionId &&
              m.optionId.toString() == optionId)
          .first
          .selectionId;
      if (otherOptionSelectionId != null) {
        final option = matchOdds.value?.options
            .where((m) => m.selectionId == otherOptionSelectionId)
            .first;
        switch (level) {
          case 0:
            otherOdd = option!.backBet.odds;
            break;
          case 1:
            otherOdd = option?.backBet2?.odds ?? '0.0';
            break;
          case 2:
            otherOdd = option?.backBet3?.odds ?? '0.0';
            break;
          default:
            otherOdd = option!.backBet.odds;
        }
      }
    } else if (type == 'bookmaker-odds') {
      final otherOptionSelectionId = mapping_controller.bookmakerMappings
          .where((m) =>
              m.questionId.toString() == questionId &&
              m.optionId.toString() == optionId)
          .first
          .selectionId;
      if (otherOptionSelectionId != null) {
        final option = bookmaker.value?.options
            .where((m) => m.selectionId == otherOptionSelectionId)
            .first;
        switch (level) {
          case 0:
            otherOdd = option!.backBet.odds;
            break;
          case 1:
            otherOdd = option?.backBet2?.odds ?? '0.0';
            break;
          case 2:
            otherOdd = option?.backBet3?.odds ?? '0.0';
            break;
          default:
            otherOdd = option!.backBet.odds;
        }
      }
    }
    return otherOdd;
  }

  getBets() async {
    String token = MySharedPref.getData('token') ?? '';
    // *) perform api call
    await BaseClient.safeApiCall(
      Constants.betLogApiUrl, // url
      RequestType.get, // request type (get,post,delete,put)
      headers: {'Authorization': 'Bearer $token'},
      onLoading: () {
        // *) indicate loading state

        update();
      },
      onSuccess: (response) {
        // api done successfully
        betLogModel = BetLogModel.fromJson(response.data);

        final sortedLogs = betLogModel.logs
          ?..sort((a, b) => DateTime.parse(b.createdAt ?? '')
              .compareTo(DateTime.parse(a.createdAt ?? '')));

        // Group by selectionId and take only the latest active bet
        final Map<String, Map<String, String?>> newBetMaps = {};

        sortedLogs?.forEach((log) {
          final selectionId = log.selectionId ?? '';
          final isback = log.isBack ?? false;
          
          if ((!log.isCashedOut!) && log.status == "0") {
            if (!newBetMaps.containsKey(selectionId)) {
              if (log.isBack ?? false) {
                newBetMaps[selectionId] = {
                  'return': '+₹${log.returnAmount.toString()}',
                  'amount': '-₹${log.investAmount.toString()}',
                  'created_at': log.createdAt ?? '',
                };
              } else {
                // For lay bets, calculate differently
                final ratio = double.tryParse(log.ratio ?? '0.0') ?? 0.0;
                final investAmount =
                    double.parse(log.investAmount?.toString() ?? '0.0');
                final layLiability = (ratio - 1) * investAmount;

                newBetMaps[selectionId] = {
                  'return': '-₹${layLiability.toStringAsFixed(2)}',
                  'amount': '+₹${investAmount.toStringAsFixed(2)}',
                  'created_at': log.createdAt ?? '',
                };
              }
            }
          }
        });

        print('Latest bets map: $newBetMaps'); // Debug print
        _betMaps.assignAll(newBetMaps);

        // Force refresh of match odds
        if (matchOdds.value != null) {
          matchOdds.refresh();
        }
        // updateBetMaps(newBetMaps);
        print('bet maps: $_betMaps');
        // *) indicate success state

        update();
      },
      // if you don't pass this method base client
      // will automaticly handle error and show message to user
      onError: (error) {
        // show error message to user
        BaseClient.handleApiError(error);
        // *) indicate error status

        update();
      },
    );
  }

  @override
  void onClose() {
    _updateTimer?.cancel();
    _matchOddsSubject?.close();
    _bookmakerSubject?.close();
    _fancySubject?.close();
    super.onClose();
  }
}