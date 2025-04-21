export function formatPhoneNumber(phone: string): string {
    let formattedPhone = phone;
    if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
    }
    if (!formattedPhone.startsWith("+91")) {
        formattedPhone = "+91" + formattedPhone.substring(1);
    }
    return formattedPhone;
}

export async function resendOtp(phone: string) {
    try {
        const formattedPhone = formatPhoneNumber(phone);

        const response = await fetch("https://book2500.funzip.in/api/resend-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone: formattedPhone }),
        });

        if (!response.ok) throw new Error("Resend OTP failed");
        return await response.json();
    } catch (error) {
        console.error("Resend OTP error:", error);
        throw error;
    }
}
