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
    ratio: string
    level: number
    bet_category: string
    match_name: string
    runner_name: string
}

export interface PredictionResponse {
    success: boolean
    message: string
    data?: {
        predictionId: string;
        status: string;
        [key: string]: string | number | boolean | object | null;
    }
}

export interface PredictionData {
    invest_amount: number;
    betoption_id: number;
    betquestion_id: number;
    match_id: number;
    ratio: string;
}

interface FancyOddsApiResponse {
    id: number;
    bet_questions: {
        id: number;
        bet_options: {
            id: number;
        }[];
    }[];
}

interface CashoutData {
    bet_invest_id: string;
}

interface CashoutResponse {
    success: boolean;
    message: string;
    refund_amount?: number;
    new_balance?: number;
}

async function validatePredictionData(data: PredictionData): Promise<{ isValid: boolean; message?: string }> {
    const token = localStorage.getItem("auth_token");
    if (!token) return { isValid: false, message: "Authentication required" };

    try {
        const response = await fetch("https://book2500.funzip.in/api/fancy-odds", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                isValid: false,
                message: errorData.message || "Failed to validate prediction data"
            };
        }

        const fancyOddsData: FancyOddsApiResponse[] = await response.json();

        const match = fancyOddsData.find((m) => m.id === data.match_id);
        if (!match) {
            return { isValid: false, message: "Invalid match ID" };
        }

        const question = match.bet_questions.find((q) => q.id === data.betquestion_id);
        if (!question) {
            return { isValid: false, message: "Invalid bet question ID" };
        }

        const option = question.bet_options.find((o) => o.id === data.betoption_id);
        if (!option) {
            return { isValid: false, message: "Invalid bet option ID" };
        }

        return { isValid: true };
    } catch (error) {
        console.error("Error validating prediction data:", error);
        return { isValid: false, message: "Failed to validate prediction data" };
    }
}

export async function createPrediction(data: PredictionData): Promise<PredictionResponse> {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    try {
        // Basic validation
        if (!data.invest_amount || data.invest_amount <= 0) {
            return {
                success: false,
                message: "Investment amount must be greater than 0"
            };
        }

        if (!Number.isInteger(data.betoption_id) || !Number.isInteger(data.betquestion_id) || !Number.isInteger(data.match_id)) {
            return {
                success: false,
                message: "Invalid ID format. All IDs must be integers"
            };
        }

        // Validate prediction data against fancy-odds API
        const validation = await validatePredictionData(data);
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.message || "Invalid prediction data"
            };
        }

        const response = await fetch("https://book2500.funzip.in/api/prediction", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Handle validation errors from server
            if (response.status === 422 && responseData.errors) {
                const errorMessages = Object.entries(responseData.errors)
                    .map(([field, messages]) => {
                        const message = Array.isArray(messages) ? messages[0] : messages;
                        return `${field.replace('_', ' ')}: ${message}`;
                    })
                    .join('. ');

                return {
                    success: false,
                    message: errorMessages
                };
            }

            // Handle other specific error cases from backend
            return {
                success: false,
                message: responseData.message || "Failed to create prediction"
            };
        }

        return {
            success: true,
            message: responseData.message || "Prediction placed successfully",
            data: responseData.data
        };

    } catch (error) {
        console.error("Error creating prediction:", error);
        return {
            success: false,
            message: "An error occurred while placing your prediction"
        };
    }
}

export async function executeCashout(data: CashoutData): Promise<CashoutResponse> {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    try {
        const response = await fetch("https://book2500.funzip.in/api/cashout", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: responseData.message || "Failed to process cashout"
            };
        }

        return {
            success: true,
            message: responseData.message || "Cashout successful",
            refund_amount: responseData.refund_amount,
            new_balance: responseData.new_balance
        };
    } catch (error) {
        console.error("Error processing cashout:", error);
        return {
            success: false,
            message: "An error occurred while processing your cashout"
        };
    }
}
