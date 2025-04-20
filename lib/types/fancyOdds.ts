export interface FancyOddsMapping {
    id: number;
    betQuestions: {
        id: number;
        betOptions: {
            id: number;
        }[];
    }[];
}

export interface Match {
    marketId: string;
    eventId: string;
    betOptions: Array<{
        id: number;
        questionId: number;
        optionId: number;
    }>;
}
