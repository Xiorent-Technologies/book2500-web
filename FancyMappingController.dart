import 'dart:convert';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../models/fancy_mapping_model.dart';

class FancyMappingController extends GetxController {
  final _mappings = <FancyMapping>[].obs;
  final _bookmakerMappings = <FancyMapping>[].obs;
  final _matchMappings = <FancyMapping>[].obs;
  final _isLoading = false.obs;
  final _error = Rxn<String>();

  String? _currentEventId;
  String? _currentMarketId;

  List<FancyMapping> get mappings => _mappings;
  List<FancyMapping> get bookmakerMappings => _bookmakerMappings;
  List<FancyMapping> get matchMappings => _matchMappings;
  bool get isLoading => _isLoading.value;
  String? get error => _error.value;

  Future<void> initialize({String? eventId, String? marketId}) async {
    if (eventId != null && marketId != null) {
      _currentEventId = eventId;
      _currentMarketId = marketId;
      await Future.wait(
          [fetchMappings(), fetchBookmakerMappings(), fetchMatchMappings()]);
    }
  }

  Future<void> fetchBookmakerMappings() async {
    print('fetching bookmaker mappings');
    if (_currentEventId == null || _currentMarketId == null) {
      _error.value = 'Event ID and Market ID are required';
      return;
    }

    try {
      _isLoading.value = true;
      _error.value = null;

      final response = await http.post(
        Uri.parse('https://book2500.funzip.in/api/bookmaker-odds'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'event_id': _currentEventId,
          'market_id': _currentMarketId,
        }),
      );
      print('bookmaker mapping ${response.body}');

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        final mappingResponse = FancyMappingResponse.fromJson(jsonData);
        _bookmakerMappings.assignAll(mappingResponse.data);
      } else {
        _error.value = 'Failed to fetch bookmaker mappings';
      }
    } catch (e) {
      _error.value = e.toString();
    } finally {
      _isLoading.value = false;
    }
  }

  Future<void> fetchMatchMappings() async {
    if (_currentEventId == null || _currentMarketId == null) {
      _error.value = 'Event ID and Market ID are required';
      return;
    }

    try {
      _isLoading.value = true;
      _error.value = null;

      final response = await http.post(
        Uri.parse('https://book2500.funzip.in/api/event-odds'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'event_id': _currentEventId,
          'market_id': _currentMarketId,
        }),
      );

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        final mappingResponse = FancyMappingResponse.fromJson(jsonData);
        _matchMappings.assignAll(mappingResponse.data);
      } else {
        _error.value = 'Failed to fetch bookmaker mappings';
      }
    } catch (e) {
      _error.value = e.toString();
    } finally {
      _isLoading.value = false;
    }
  }

  FancyMapping? getBookmakerBySelectionId(String selectionId) {
    return _bookmakerMappings.firstWhere(
      (mapping) => mapping.selectionId == selectionId,
      orElse: () => FancyMapping(
        runnerName: '',
        matchId: '',
        questionId: 0,
        optionId: 0,
        optionName: '',
        selectionId: '',
        min: '',
        max: '',
      ),
    );
  }

  FancyMapping? getMatchBySelectionId(String selectionId) {
    return _matchMappings.firstWhere(
      (mapping) => mapping.selectionId == selectionId,
      orElse: () => FancyMapping(
        runnerName: '',
        matchId: '',
        questionId: 0,
        optionId: 0,
        optionName: '',
        selectionId: '',
        min: '',
        max: '',
      ),
    );
  }

  Future<void> fetchMappings() async {
    print('fetching mappings');
    if (_currentEventId == null || _currentMarketId == null) {
      _error.value = 'Event ID and Market ID are required';
      return;
    }

    try {
      _isLoading.value = true;
      _error.value = null;

      final response = await http.post(
        Uri.parse('https://book2500.funzip.in/api/fancy-odds'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'event_id': _currentEventId,
          'market_id': _currentMarketId,
        }),
      );

      print('mapping ${response.body}');

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        final mappingResponse = FancyMappingResponse.fromJson(jsonData);
        _mappings.assignAll(mappingResponse.data);
      } else {
        _error.value = 'Failed to fetch fancy mappings';
      }
    } catch (e) {
      _error.value = e.toString();
    } finally {
      _isLoading.value = false;
    }
  }

  FancyMapping? getBySelectionId(String selectionId) {
    return _mappings.firstWhere(
      (mapping) => mapping.selectionId == selectionId,
      orElse: () => FancyMapping(
        runnerName: '',
        matchId: '',
        questionId: 0,
        optionId: 0,
        optionName: '',
        selectionId: '',
        min: '',
        max: '',
      ),
    );
  }

  List<FancyMapping> getBySelectionIdAndOptionName(
      String selectionId, String optionName) {
    return _mappings
        .where((mapping) =>
            mapping.selectionId == selectionId &&
            mapping.optionName.toLowerCase() == optionName.toLowerCase())
        .toList();
  }

  List<FancyMapping> getByMatchId(String matchId) {
    return _mappings.where((mapping) => mapping.matchId == matchId).toList();
  }

  @override
  Future<void> refresh() async {
    await Future.wait([
      fetchMappings(),
      fetchBookmakerMappings(),
    ]);
  }

  void updateMatchIds(String eventId, String marketId) {
    _currentEventId = eventId;
    _currentMarketId = marketId;
  }
}

// Initialize in your binding
class MappingBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(FancyMappingController());
  }
}