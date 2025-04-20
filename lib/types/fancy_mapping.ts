export interface FancyMappingResponse {
    message: string;
    data: FancyMapping[];
}

export interface FancyMapping {
    runnerName: string;
    matchId: string;
    questionId: number;
    optionId: number;
    optionName: string;
    selectionId: string;
    min: string;
    max: string;
}

export interface PredictionRequest {
    market_id: string;
    event_id: string;
    invest_amount: number;
    RunnerName: string;
    match_id: string;
    betquestion_id: number;
    betoption_id: number;
    Option_name: string;
    ratio: string;
    selection_id: string;
    type: 'fancy-odds' | 'bookmaker-odds' | 'match-odds';
    is_back: boolean;
    level: number;
}