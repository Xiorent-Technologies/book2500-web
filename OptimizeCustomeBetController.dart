Future<void> sendCashout(String type, [String? selectionId]) async {
    Get.dialog(
      AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.monetization_on, color: Colors.amber),
            SizedBox(width: 10),
            Text('Confirm Cashout'),
          ],
        ),
        content: const Text('Do you want to proceed with the cashout?'),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Get.back();
              if (type == 'fancy-odds') {
                _executeFancyCashout(type, selectionId!);
              } else {
                _executeCashout(type);
              }
              // _executeCashout(type);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Future<void> _executeFancyCashout(String type, String selectionId) async {
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
    print(
        'Starting  cashout execution for type: $type , selection Id $selectionId');
    String token = MySharedPref.getData('token') ?? '';
    print('Retrieved token: ${token.isNotEmpty ? 'Token exists' : 'No token'}');

    print('Fetching bets...');
    await getBets();

    if (betLogModel.logs == null || betLogModel.logs!.isEmpty) {
      // Close the progress snackbar
      Get.closeAllSnackbars();
      print('No bets found in betLogModel');
      showCustomDialogue(
          title: 'No Previous bets found to cashout',
          description: 'You have no bets to cashout',
          icon: Icons.cancel,
          onPressed: () => Get.back(),
          buttonText: 'Continue');
      return;
    }

    final mapped = mapping_controller.getBySelectionId(selectionId);
    String? matchId = mapped?.matchId;
    int? questionId = mapped?.questionId;

    if (matchId == null || matchId.isEmpty || questionId == null) {
      print('Invalid matchId found');
      // Close the progress snackbar
      Get.closeAllSnackbars();
      showCustomDialogue(
          title: 'Unable to Cashout',
          description: 'No bets for this match',
          icon: Icons.cancel,
          onPressed: () => Get.back(),
          buttonText: 'Continue');
      return;
    }

    print('Filtering pending bets for matchId: $matchId');
    print(
        'all bets found is ${betLogModel.logs!.first.status} and match id ${betLogModel.logs!.first.matchId}');
    final pendingBets = betLogModel.logs
            ?.where((log) =>
                log.matchId == matchId &&
                log.status?.toLowerCase() == '0' &&
                log.betquestionId == questionId.toString())
            .toList() ??
        [];
    print('Found ${pendingBets.length} pending bets');

    if (pendingBets.isEmpty) {
      // Close the progress snackbar
      Get.closeAllSnackbars();
      print('No pending bets found for cashout');
      showCustomDialogue(
          title: 'No Pending Bets',
          description: 'You have no pending bets to cashout for this match',
          icon: Icons.cancel,
          onPressed: () => Get.back(),
          buttonText: 'Continue');
      return;
    }

    print('Sorting pending bets by creation date');
    pendingBets.sort((a, b) => DateTime.parse(b.createdAt ?? '')
        .compareTo(DateTime.parse(a.createdAt ?? '')));

    final latestBet = pendingBets.first;
    print('Selected latest bet with ID: ${latestBet.id}');

    final data = {
      'bet_invest_id': latestBet.id,
      'match_id': matchId,
      'type': type,
    };

    print('Making fancy cashout API call with data $data');
    await BaseClient.safeApiCall(
      // 'https://webhook.site/b75b69b2-4fd2-49c9-9b57-ada0c5b8a440',
      'https://book2500.funzip.in/api/cashout',
      RequestType.post,
      headers: {'Authorization': 'Bearer $token'},
      data: data,
      onLoading: () {
        print('Cashout API call loading...');
        update();
      },
      onSuccess: (response) {
        // Close the progress snackbar
        Get.closeAllSnackbars();
        print('Cashout API response received: ${response.data}');
        if (response.data['success'] == true) {
          print('Cashout successful');
          final message = response.data['message'] as String?;
          final refundAmount = response.data['refund_amount'] as num?;
          final newBalance = response.data['new_balance'] as num?;

          String description = 'Cashout successful';
          if (message != null) {
            description = message;
          }
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
        } else {
          print('Cashout failed: ${response.data['message']}');
          showCustomDialogue(
              title: 'Unable to Cashout',
              description: response.data['message'] ?? 'Please try again',
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
      },
      onError: (error) {
        // Close the progress snackbar
        Get.closeAllSnackbars();
        print('Cashout API error: $error');
        BaseClient.handleApiError(error);
        update();
      },
    );
  }

  Future<void> _executeCashout(String type) async {
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
    print('Starting cashout execution for type: $type');
    String token = MySharedPref.getData('token') ?? '';
    print('Retrieved token: ${token.isNotEmpty ? 'Token exists' : 'No token'}');

    print('Fetching bets...');
    await getBets();

    if (betLogModel.logs == null || betLogModel.logs!.isEmpty) {
      // Close the progress snackbar
      Get.closeAllSnackbars();
      print('No bets found in betLogModel');
      showCustomDialogue(
          title: 'No Previous bets found to cashout',
          description: 'You have no bets to cashout',
          icon: Icons.cancel,
          onPressed: () => Get.back(),
          buttonText: 'Continue');
      return;
    }
    print('Found ${betLogModel.logs?.length} bets in total');

    String? matchId;
    int? questionId;
    print('Determining matchId based on type: $type');
    if (type == 'bookmaker-odds') {
      matchId = mapping_controller.bookmakerMappings.first.matchId;
      questionId = mapping_controller.bookmakerMappings.first.questionId;
      print('Using bookmaker matchId: $matchId');
    } else if (type == 'fancy-odds') {
      matchId = mapping_controller.mappings.first.matchId;
      print('Using fancy matchId: $matchId');
    } else {
      matchId = mapping_controller.matchMappings.first.matchId;
      questionId = mapping_controller.matchMappings.first.questionId;
      print('Using match odds matchId: $matchId');
    }

    if (matchId == null || matchId.isEmpty) {
      print('Invalid matchId found');
      // Close the progress snackbar
      Get.closeAllSnackbars();
      showCustomDialogue(
          title: 'Unable to Cashout',
          description: 'No bets for this match',
          icon: Icons.cancel,
          onPressed: () => Get.back(),
          buttonText: 'Continue');
      return;
    }

    print('Filtering pending bets for matchId: $matchId');
    print(
        'all bets found is ${betLogModel.logs!.first.status} and match id ${betLogModel.logs!.first.matchId}');
    final pendingBets = betLogModel.logs
            ?.where((log) =>
                log.matchId == matchId && log.status?.toLowerCase() == '0')
            .toList() ??
        [];
    print('Found ${pendingBets.length} pending bets');

    if (pendingBets.isEmpty) {
      // Close the progress snackbar
      Get.closeAllSnackbars();
      print('No pending bets found for cashout');
      showCustomDialogue(
          title: 'No Pending Bets',
          description: 'You have no pending bets to cashout for this match',
          icon: Icons.cancel,
          onPressed: () => Get.back(),
          buttonText: 'Continue');
      return;
    }

    print('Sorting pending bets by creation date');
    pendingBets.sort((a, b) => DateTime.parse(b.createdAt ?? '')
        .compareTo(DateTime.parse(a.createdAt ?? '')));

    final latestBet = pendingBets.first;
    print('Selected latest bet with ID: ${latestBet.id}');

    print('Making cashout API call');
    await BaseClient.safeApiCall(
      // 'https://webhook.site/b75b69b2-4fd2-49c9-9b57-ada0c5b8a440',
      'https://book2500.funzip.in/api/cashout',
      RequestType.post,
      headers: {'Authorization': 'Bearer $token'},
      data: {
        'bet_invest_id': latestBet.id,
        'match_id': matchId,
        'type': type,
      },
      onLoading: () {
        print('Cashout API call loading...');
        update();
      },
      onSuccess: (response) {
        // Close the progress snackbar
        Get.closeAllSnackbars();
        print('Cashout API response received: ${response.data}');
        if (response.data['success'] == true) {
          print('Cashout successful');
          final message = response.data['message'] as String?;
          final refundAmount = response.data['refund_amount'] as num?;
          final newBalance = response.data['new_balance'] as num?;

          String description = 'Cashout successful';
          if (message != null) {
            description = message;
          }
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
        } else {
          print('Cashout failed: ${response.data['message']}');
          showCustomDialogue(
              title: 'Unable to Cashout',
              description: response.data['message'] ?? 'Please try again',
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
      },
      onError: (error) {
        // Close the progress snackbar
        Get.closeAllSnackbars();
        print('Cashout API error: $error');
        BaseClient.handleApiError(error);
        update();
      },
    );
  }