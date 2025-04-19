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
        'invested_amount': stake, //double
        "RunnerName": mapped.first.runnerName,
        "Match_id": mapped.first.matchId,
        "Question_id": mapped.first.questionId,
        "Option_id": mapped.first.optionId,
        "Option_name": mapped.first.optionName,
        'ratio': odds, //double
        'selection_id': selectionId, //string
        'type': type, //string
        'is_back': isBack, //bool
        'level': level //int
      };
    } else if (type == 'bookmaker-odds') {
      final mapped = mapping_controller.getBookmakerBySelectionId(selectionId);
      body = {
        'market_id': marketId, //string
        'event_id': eventId, //string
        // 'game_id': '4', //string
        'invested_amount': stake, //double
        "RunnerName": mapped?.runnerName,
        "Match_id": mapped?.matchId,
        "Question_id": mapped?.questionId,
        "Option_id": mapped?.optionId,
        "Option_name": mapped?.optionName,
        'ratio': odds, //double
        'selection_id': selectionId, //string
        'type': type, //string
        'is_back': isBack, //bool
        'level': level //int
      };
    } else {
      final mapped = mapping_controller.getMatchBySelectionId(selectionId);
      body = {
        'market_id': marketId, //string
        'event_id': eventId, //string
        // 'game_id': '4', //string
        'invested_amount': stake, //double
        "RunnerName": mapped?.runnerName,
        "Match_id": mapped?.matchId,
        "Question_id": mapped?.questionId,
        "Option_id": mapped?.optionId,
        "Option_name": mapped?.optionName,
        'ratio': odds, //double
        'selection_id': selectionId, //string
        'type': type, //string
        'is_back': isBack, //bool
        'level': level //int
      };
    }

    print('sending prediction $body');
    await BaseClient.safeApiCall(
      'https://book2500.funzip.in/api/prediction',
      RequestType.post,
      headers: {'Authorization': 'Bearer $token'},
      data: body,
      onLoading: () => update(),
      onSuccess: (response) {
        // Close the progress snackbar
        Get.closeAllSnackbars();

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
      },
      onError: (error) {
        // Close the progress snackbar
        Get.closeAllSnackbars();

        BaseClient.handleApiError(error);
        update();
      },
    );
  }