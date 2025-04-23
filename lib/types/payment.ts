export interface PaymentGatewayModel {
    page_title?: string;
    gateways?: Gateway[];
    success?: boolean;
}

export interface Gateway {
    id: number;
    image?: string;
    name: string;
    minimum_deposit_amount: string;
    maximum_deposit_amount: string;
    rate?: string;
    fixed_charge?: string;
    percentage_charge?: string;
    gateway_key_one?: string;
    gateway_key_two?: string;
    gateway_key_three?: string;
    gateway_key_four?: any;
    status?: string;
    created_at?: string;
    updated_at?: string;
    image_url?: string;
    client_id?: string;
    secret_key?: string;
    app_id?: string;
    ac_phone_num?: any;
    account_detais?: any;
}
