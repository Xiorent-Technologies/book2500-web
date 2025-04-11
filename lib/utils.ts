import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function updateBalanceFromAPI() {
  try {
    const token = localStorage.getItem("auth_token")
    if (!token) return null;

    const response = await fetch("https://book2500.funzip.in/api/profile-setting", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json()

    // Check if the response has the correct structure
    if (data.success && data.data && typeof data.data.balance !== 'undefined') {
      // Update localStorage
      const userData = localStorage.getItem('user_data')
      if (userData) {
        const parsedData = JSON.parse(userData)
        parsedData.balance = data.data.balance
        localStorage.setItem('user_data', JSON.stringify(parsedData))
      }
      return data.data.balance
    }
    return null
  } catch (error) {
    console.error("Error updating balance:", error)
    return null
  }
}
