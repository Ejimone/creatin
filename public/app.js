const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed contract address
const contractABI = [{"inputs":[{"internalType":"address","name":"_warden","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"string","name":"foodItem","type":"string"}],"name":"FoodOrderCancelled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"string","name":"foodItem","type":"string"}],"name":"FoodOrdered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"enum CollegeBreakfast.PortalStatus","name":"newStatus","type":"uint8"}],"name":"PortalStatusChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":false,"internalType":"bool","name":"isRegistered","type":"bool"}],"name":"StudentRegistrationChanged","type":"event"},{"inputs":[],"name":"closePortal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_student","type":"address"}],"name":"getLastOrder","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_student","type":"address"}],"name":"getStudentOrderCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTotalOrders","outputs":[{"internalType":"uint256","name":"totalOrders","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"isStudentRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"openPortal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_foodItem","type":"string"}],"name":"orderFood","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"portalStatus","outputs":[{"internalType":"enum CollegeBreakfast.PortalStatus","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_student","type":"address"}],"name":"registerStudent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"studentOrderCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"studentOrders","outputs":[{"internalType":"string","name":"foodItem","type":"string"},{"internalType":"uint256","name":"orderTime","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_student","type":"address"}],"name":"unregisterStudent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"warden","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

let provider;
let signer;
let contract;

document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectButton");
    const openPortalButton = document.getElementById("openPortalButton");
    const closePortalButton = document.getElementById("closePortalButton");
    const registerStudentButton = document.getElementById("registerStudentButton");
    const unregisterStudentButton = document.getElementById("unregisterStudentButton");
    const orderFoodButton = document.getElementById("orderFoodButton");

    connectButton.addEventListener("click", connect);
    openPortalButton.addEventListener("click", openPortal);
    closePortalButton.addEventListener("click", closePortal);
    registerStudentButton.addEventListener("click", registerStudent);
    unregisterStudentButton.addEventListener("click", unregisterStudent);
    orderFoodButton.addEventListener("click", orderFood);
});

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            const address = await signer.getAddress();
            document.getElementById("connectionStatus").innerText = "Connected";
            document.getElementById("userAddress").innerText = address;

            enableButtons();
            updateContractInfo();
        } catch (error) {
            console.error("Connection failed:", error);
            document.getElementById("transactionStatus").innerText = "Connection failed.";
        }
    } else {
        document.getElementById("transactionStatus").innerText = "MetaMask is not installed.";
    }
}

function enableButtons() {
    document.getElementById("openPortalButton").disabled = false;
    document.getElementById("closePortalButton").disabled = false;
    document.getElementById("registerStudentButton").disabled = false;
    document.getElementById("unregisterStudentButton").disabled = false;
    document.getElementById("orderFoodButton").disabled = false;
}

async function updateContractInfo() {
    try {
        const portalStatus = await contract.portalStatus();
        document.getElementById("portalStatus").innerText = portalStatus === 1 ? "Open" : "Closed";

        const address = await signer.getAddress();
        const orderCount = await contract.getStudentOrderCount(address);
        document.getElementById("orderCount").innerText = orderCount.toString();

        const [foodItem, orderTime] = await contract.getLastOrder(address);
        document.getElementById("lastOrder").innerText = foodItem ? `${foodItem} (at ${new Date(orderTime * 1000).toLocaleTimeString()})` : "No orders yet";
    } catch (error) {
        console.error("Failed to update info:", error);
    }
}

async function handleTransaction(transaction, successMessage) {
    const statusElement = document.getElementById("transactionStatus");
    try {
        statusElement.innerText = "Transaction pending...";
        const tx = await transaction();
        await tx.wait();
        statusElement.innerText = successMessage;
        updateContractInfo();
    } catch (error) {
        console.error("Transaction failed:", error);
        statusElement.innerText = `Error: ${error.message}`;
    }
}

async function openPortal() {
    await handleTransaction(() => contract.openPortal(), "Portal opened successfully.");
}

async function closePortal() {
    await handleTransaction(() => contract.closePortal(), "Portal closed successfully.");
}

async function registerStudent() {
    const studentAddress = document.getElementById("studentAddressInput").value;
    if (!ethers.utils.isAddress(studentAddress)) {
        document.getElementById("transactionStatus").innerText = "Invalid student address.";
        return;
    }
    await handleTransaction(() => contract.registerStudent(studentAddress), "Student registered successfully.");
}

async function unregisterStudent() {
    const studentAddress = document.getElementById("studentAddressInput").value;
    if (!ethers.utils.isAddress(studentAddress)) {
        document.getElementById("transactionStatus").innerText = "Invalid student address.";
        return;
    }
    await handleTransaction(() => contract.unregisterStudent(studentAddress), "Student unregistered successfully.");
}

async function orderFood() {
    const foodItem = document.getElementById("foodItemInput").value;
    if (!foodItem) {
        document.getElementById("transactionStatus").innerText = "Food item cannot be empty.";
        return;
    }
    await handleTransaction(() => contract.orderFood(foodItem), "Food ordered successfully.");
}
