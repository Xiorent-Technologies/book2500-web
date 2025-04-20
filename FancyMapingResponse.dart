class FancyMappingResponse {
  final String message;
  final List<FancyMapping> data;

  FancyMappingResponse({
    required this.message,
    required this.data,
  });

  factory FancyMappingResponse.fromJson(Map<String, dynamic> json) {
    return FancyMappingResponse(
      message: json['message'] ?? '',
      data: (json['data'] as List?)
              ?.map((x) => FancyMapping.fromJson(x))
              .toList() ??
          [],
    );
  }
}

class FancyMapping {
  final String runnerName;
  final String matchId;
  final int questionId;
  final int optionId;
  final String optionName;
  final String selectionId;
  final String min;
  final String max;

  FancyMapping({
    required this.runnerName,
    required this.matchId,
    required this.questionId,
    required this.optionId,
    required this.optionName,
    required this.selectionId,
    required this.min,
    required this.max,
  });

  factory FancyMapping.fromJson(Map<String, dynamic> json) {
    return FancyMapping(
      runnerName: json['RunnerName'] ?? '',
      matchId: json['Match_id'] ?? '',
      questionId: int.tryParse(json['Question_id'].toString()) ?? 0,
      optionId: int.tryParse(json['Option_id'].toString()) ?? 0,
      optionName: json['Option_name'] ?? '',
      selectionId: json['SelectionId'] ?? '',
      min: json['min'] ?? '',
      max: json['max'] ?? '',
    );
  }
}