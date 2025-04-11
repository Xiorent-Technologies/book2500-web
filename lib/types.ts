export interface Gateway {
    id: number
    name: string
    min_amo: number
    max_amo: number
}

export interface WithdrawMethodResponse {
    success: boolean
    message?: string
    gateways: Gateway[]
}
