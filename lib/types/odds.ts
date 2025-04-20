export interface EventOdd {
    RunnerName: string;
    Match_id: string;
    Question_id: number;
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
}

export interface EventOddsResponse {
    message: string;
    data: EventOdd[];
}
