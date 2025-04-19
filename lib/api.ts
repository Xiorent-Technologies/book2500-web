export async function fetchUserBalance() {
    const token = localStorage.getItem('auth_token')
    if (!token) return null

    try {
        const response = await fetch('https://book2500.funzip.in/api/user-balance', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        })
        const data = await response.json()
        return data.balance
    } catch (error) {
        console.error('Error fetching balance:', error)
        return null
    }
}

export async function fetchUserProfile() {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('Not authenticated')

    try {
        const response = await fetch('https://book2500.funzip.in/api/profile-setting', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        })

        if (!response.ok) throw new Error('Failed to fetch profile')
        const data = await response.json()
        return data.data
    } catch (error) {
        console.error('Error fetching profile:', error)
        throw error
    }
}

export interface BetPlacementData {
    invested_amount: number
    event_id: string
    market_id: string
    selection_id: string
    type: string
    is_back: boolean
    ratio: number
    level: number
    bet_category: string
    match_name: string
    runner_name: string
}

export interface PredictionData {
    invested_amount: number
    event_id: string
    market_id: string
    selection_id: string
    type: string
    is_back: boolean
    ratio: string
    level: number
    bet_category: string
    match_name: string
    runner_name: string
}

// "match_id": mapped?.matchId,
//     "betquestion_id": mapped?.questionId,
//         "betoption_id": mapped?.optionId,

export interface PredictionResponse {
    success: boolean
    message: string
    data?: {
        predictionId: string;
        status: string;
        [key: string]: string | number | boolean | object | null; // Add additional fields as needed
    }
}

export async function createPrediction(predictionData: PredictionData): Promise<PredictionResponse> {
    try {
        const token = localStorage.getItem("auth_token")
        if (!token) throw new Error("Authentication required")

        const response = await fetch("https://book2500.funzip.in/api/prediction", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                ...predictionData,
                invested_amount: Number(predictionData.invested_amount),
                ratio: Number(predictionData.ratio),
                level: Number(predictionData.level)
            })
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create prediction')
        }

        return {
            success: true,
            message: data.message || 'Prediction created successfully',
            data: data.data
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error creating prediction:", error)
        return {
            success: false,
            message: errorMessage
        }
    }
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

export interface FancyMappingResponse {
    success: boolean;
    data: FancyMapping[];
}

export async function fetchFancyMappings(eventId: string, marketId: string): Promise<FancyMapping[]> {
    try {
        const response = await fetch('https://book2500.in/api/fancy-odds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_id: eventId,
                market_id: marketId
            })
        });

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching fancy mappings:', error);
        return [];
    }
}

export async function fetchBookmakerMappings(eventId: string, marketId: string): Promise<FancyMapping[]> {
    try {
        const response = await fetch('https://book2500.funzip.in/api/bookmaker-odds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_id: eventId,
                market_id: marketId
            })
        });

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching bookmaker mappings:', error);
        return [];
    }
}

export async function fetchMatchMappings(eventId: string, marketId: string): Promise<FancyMapping[]> {
    try {
        const response = await fetch('https://book2500.funzip.in/api/event-odds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_id: eventId,
                market_id: marketId
            })
        });

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching match mappings:', error);
        return [];
    }
}
