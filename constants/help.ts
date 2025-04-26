export function formatAmount(amount: any) {
    if (typeof amount === "string") {
        amount = parseFloat(amount);
    }

    if (isNaN(amount)) {
        return "Invalid number";
    }

    // Round to nearest thousand
    const roundedAmount = Math.round(amount / 1000) * 1000;

    return roundedAmount.toLocaleString();
}

export function dummyImage() {
    // https://randomuser.me/api/portraits/women/31.jpg using this link and math.random
    return `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100) + 1}.jpg`;
}
export function formatCreatedAt(timestamp : any) {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    // Extract date components
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = String(date.getFullYear()).slice(-2);

    // Extract time components
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const amPm = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12 || 12;

    return `${day}/${month}/${year} - ${hours}:${minutes} ${amPm}`;
}
