import {createWalletClient, custom, parseEther, createPublicClient, http} from "https://esm.sh/viem";
import {sepolia} from "https://esm.sh/viem/chains";

//contract infos
const contractAddress = '0x5bd3a4E94a5F2244F9754C40D8C6548E3cF2dCCC';
let contractABI = null; // ABI to be loaded from an extern file

//load ABI from JSON file
async function loadABI() {
    try {
        const response = await fetch('contractABI.json'); //getting the ABI from 'contractABI.json'
        contractABI = await response.json();
        console.log("ABI loaded successfully");
    } catch (error) {
        console.error("Error loading ABI:", error);
    }
}

// calling the loadABI function at the start of the script
await loadABI(); // use `await` here to be sure the ABI is loaded before contract interactions

//global variable for the wallet 
let walletClient = null; //object type viem WalletClient (constructor "createWalletClient")
let userAccount = null; //will the the main adress of a wallet

//public client creation for read-only (view or pure functions)
const publicClient = createPublicClient({
	chain: sepolia,
	transport: http()
})

//global variable for the number of cars currently hold by the renting company
let nbCars;

async function getNumberOfCars() {
    try {
        // calling getAllCars from SC
        const cars = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,        
            functionName: "getAllCars",
        });

        // save the car numbers
        nbCars = cars.length;

        //console.log("Number of cars:", numberOfCars);
        return nbCars;
    } catch (error) {
        console.error("Error fetching the number of cars:", error);
    }
}

//calling number of car func at file opening :
await getNumberOfCars();
console.log("current number of cars : ", nbCars);

//creating the struct to have similars one as in the SC 
const LeaseState = {
    0: "Inactive",
    1: "Created",
    2: "Confirmed",
    3: "Running"
};

const PaymentState = {
    0: "On Time",
    1: "Late",
    2: "Missed"
};

// function to connect user wallet (using viem library)
async function connectWallet() {
    if (window.ethereum) {
        try {
            // creating object clientwallet connected to sepolia via metamask
            walletClient = createWalletClient({
                chain: sepolia,
                transport: custom(window.ethereum), //using metamask as transport
            });

            //getting account address
            const accounts = await walletClient.request({
                method: 'eth_requestAccounts',
            });

			userAccount = accounts[0]; // storing the main client address in userAccount variable

			alert("Wallet succesfully connected : " + accounts[0]);

			//printing wallet address on page
            const walletAddressElement = document.getElementById('walletAddress');
            walletAddressElement.textContent = `Wallet connected: ${accounts[0]}`;

        } catch (error) {
            console.error("Connexion error :", error);
            alert("Connexion error, check you are on the Sepolia network");
        }
    } else {
        alert("Please install a webbroser waller to use the Dapp");
    }
}

// function link adding car form to createCar from SC
async function submitCarForm(event) {
    event.preventDefault(); //prevent page refreshing

	if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

	try {
		//gathering form filling variables
		const model = document.getElementById('model').value;
		const color = document.getElementById('color').value;
		const yearOfMatriculation = parseInt(document.getElementById('year').value);
		const originalValue = parseFloat(document.getElementById('value').value);

        // parseEther take the decimal ETH value from the form and convert it into the wei value
        const valueInWei = parseEther(originalValue.toString());

        // args prep before calling fct createCar from SC
        const args = [model, color, yearOfMatriculation, valueInWei];

        // sending transaction by calling fct createCar from SC
        const txHash = await walletClient.writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "createCar",
            args,
			account: userAccount, //will only work if the owner wallet is connected as createCar is onlyOwner
        });

        alert(`Transaction sent! Hash: ${txHash}`);
    } catch (error) {
        console.error("Error adding car:", error);
        alert("Failed to add car. Please try again.");
    }
}

/* function to load the car list from SC and display it
TODO : 
- make the function robust to non-consecutive IDs (in case of car deleting)
- display only available cars ?
*/
async function loadCars() {
    //retreiving current car number
    await getNumberOfCars();
    console.log("current number of cars : ", nbCars);

    try {
        let carID = 1; //first car has id : 1 and after we increment
        let carDetails;
        const carListElement = document.getElementById('carList');
        carListElement.innerHTML = ""; // reinitialize car list

        // loading cars with consecutive ids from 1 to nbCars
        while (carID <= nbCars) {
            try {
                // calling the getCarsDetails from SC to get each car details
                carDetails = await publicClient.readContract({ //using the publicClient because its a view fct
                    address: contractAddress,
                    abi: contractABI,
                    functionName: "getCarDetails",
                    args: [carID],
                });

                // HTML element creating and adding to the printing list
                const carItem = document.createElement("div");
                carItem.innerHTML = `
                    <p><strong>Car ID:</strong> ${carID}</p>
                    <p><strong>Model:</strong> ${carDetails.model}</p>
                    <p><strong>Color:</strong> ${carDetails.color}</p>
                    <p><strong>Year of Matriculation:</strong> ${carDetails.yearOfMatriculation}</p>
                    <p><strong>Original Value:</strong> ${parseInt(carDetails.originalValue) / 1e18} ETH (${parseInt(carDetails.originalValue)} wei)</p>
                    <p><strong>Mileage:</strong> ${carDetails.mileage}</p>
                `;
                carListElement.appendChild(carItem);
                carID++;

            } catch (error) {
				console.error("Error try catch loading cars:", error);
                break;
            }
        }
    } catch (error) {
        console.error("Error loading cars:", error);
        alert("Failed to load cars. Please try again.");
    }
}

//function to initiate a new lease demand
async function submitLeaseForm(event) {
    event.preventDefault(); //prevent the browser from refreshing the page

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

	//gathering form filling variables
    const carId = document.getElementById('carId').value;
    const driverExperience = document.getElementById('driverExperience').value;
    const mileageCap = document.getElementById('mileageCap').value;
    const contractDuration = document.getElementById('contractDuration').value;

    try {
		//getting the car details from the asked car (using publicClient because it's a view fct)
        const carDetails = await publicClient.readContract({
            client: walletClient,
            address: contractAddress,
            abi: contractABI,
            functionName: "getCarDetails",
            args: [carId],
        });

		//calling the calculateMonthlyQuota from the SC using publicClient cause it's a pure fct
        const monthlyPayment = await publicClient.readContract({
            client: walletClient,
            address: contractAddress,
            abi: contractABI,
            functionName: "calculateMonthlyQuota",
            args: [
                //carDetails.originalValue,
                carId,
                driverExperience,
                mileageCap,
                contractDuration,
            ],
        });

		//calculate the payments to made
        const downPayment = BigInt(3) * monthlyPayment;
        const totalPayment = monthlyPayment + downPayment;
		console.log('downPayment', downPayment); //console log
		console.log('totalPayment', totalPayment); //console log

		//calling the initiateLease from SC identified as the walletClient 
        await walletClient.writeContract({
            client: walletClient,
            address: contractAddress,
            abi: contractABI,
            functionName: "initiateLease",
            args: [
                carId,
                driverExperience,
                mileageCap,
                contractDuration,
            ],
            account: userAccount,
            value: totalPayment, // transaction montant
        });

        alert(`Lease initiated! Car ID: ${carId}`);
    } catch (error) {
        console.error("Error initiating lease:", error);
        alert("Failed to initiate lease. Please try again.");
    }
}

// function to confirmLease
async function submitConfirmLeaseForm(event) {
    event.preventDefault(); //prevent the browser from refreshing the page

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

	//gathering variable for filled form
    const carId = document.getElementById('confirmCarId').value;

    try {
        // confirmLease from SC function call (identified as walletClient because you need to be identified as the owner)
        await walletClient.writeContract({
            //client: walletClient,
            address: contractAddress,
            abi: contractABI,
            functionName: "confirmLease",
            args: [carId],
            account: userAccount, // need to be BilBoyd wallet and main address to confirm rental (onlyOwner fct)
        });

        alert(`Lease confirmed for Car ID: ${carId}`);
    } catch (error) {
        console.error("Error confirming lease:", error);
        alert("Failed to confirm lease. Please try again.");
    }
}

// function for lessee to validate the lease and obtain the car (NFT)
async function submitValidateLeaseForm(event) {
    event.preventDefault(); // Prevent page refresh

    //gathering variable for filled form
    const carId = document.getElementById('validateCarId').value;

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        // calling validateLease from SC
        await walletClient.writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "validateLease",
            args: [carId],
            account: userAccount, // must be the lessee
        });

        alert(`Lease validated for Car ID: ${carId}. You now have the key!`);
    } catch (error) {
        console.error("Error validating lease:", error);
        alert("Failed to validate lease. Please try again.");
    }
}

//printing car owners and status
async function loadCarsWithOwners() {
    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    //retreiving current car number
    await getNumberOfCars();
    console.log("current number of cars : ", nbCars);

    try {
        let carID = 1;
        const carListElement = document.getElementById('carOwners');
        carListElement.innerHTML = ""; // reinitialize car list

        // loop for checking all the cars from the Bilboyd company
        while (carID <= nbCars) {
            try {
                // calling ownerOf herited from ERC721 from our SC to know the NFT owner
                const owner = await publicClient.readContract({ //using publicClient because ownerOf is a view fct
                    address: contractAddress,
                    abi: contractABI,
                    functionName: "ownerOf",
                    args: [carID],
                });

                // HTML element creation to print the list of cars and there owners
                const carItem = document.createElement("div");
                carItem.innerHTML = `
                    <p><strong>Car ID:</strong> ${carID}</p>
                    <p><strong>Owner Address:</strong> ${owner}</p>
                `;
                carListElement.appendChild(carItem);
                carID++;

            } catch (error) {
                console.error(`Error loading car with ID ${carID}:`, error);
                break;
            }
        }
    } catch (error) {
        console.error("Error loading cars with owners:", error);
        alert("Failed to load cars with owners. Please try again.");
    }
}

//load and print all leases (not regarding their currents states)
/* TODO : 
- Make sure we can display dates (next due date, start date, ...)
- Display other info from struct Lease is much more extensive than what we're currently displaying
- Make sure the PaymentStatus is update well (check if updated regularly enought in SC)
*/
async function loadAllLeases() {

    let leaseIndex = 0;

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        // Retrieve all leases regardless of their state
        const allLeases = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "getAllLeases",
            account: userAccount, // Must be an owner account
        });

        const leasesElement = document.getElementById('allLeases');
        leasesElement.innerHTML = ""; // Reset display

        for (let lease of allLeases) {
            //const carId = lease.carId;
            leaseIndex +=1; // the lease index correspond to the carId

            // HTML element creation to display lease details
            //<p><strong>Next Payment Due:</strong> ${new Date(lease.nextPaymentDueDate * BigInt(1000)).toLocaleString()}</p>
            const leaseItem = document.createElement("div");
            leaseItem.innerHTML = `
                <p><strong>Car ID:</strong> ${leaseIndex}</p>
                <p><strong>Lessee Address:</strong> ${lease.lessee}</p>
                <p><strong>Monthly Payment:</strong> ${lease.monthlyPayment} wei</p>
                <p><strong>Down Payment:</strong> ${lease.downPayment} wei</p>
                <p><strong>Lease State:</strong> ${LeaseState[lease.state]}</p>
                <p><strong>Last Payment Status:</strong> ${PaymentState[lease.lastPaymentStatut]}</p>
                <p><strong>Consecutive Late Payments:</strong> ${lease.consecutiveMissedPayments}</p>
            `;
            leasesElement.appendChild(leaseItem);
        }
    } catch (error) {
        console.error("Error loading leases:", error);
        alert("Failed to load leases. Please try again.");
    }
}

// function for lessee to make a monthly payment
async function submitMonthlyPaymentForm(event) {
    event.preventDefault(); // prevent page refresh

    const carId = parseInt(document.getElementById('paymentCarId').value); // carID the lessee is currently renting

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        // Fetch the amount to be paid from the contract
        const requiredPayment = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "calculateMonthlyPaymentAmount",
            args: [carId],
        });

        // calling makeMonthlyPayment on the SC with the retreived requiredPayment from "calculateMonthlyPaymentAmount" from SC
        const txHash = await walletClient.writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "makeMonthlyPayment",
            args: [carId],
            account: userAccount,
            value: requiredPayment, // send the exact amount needed
        });

        alert(`Monthly payment sent for Car ID ${carId}. Transaction hash: ${txHash}`);
    } catch (error) {
        console.error("Error making monthly payment:", error);
        alert("Failed to make monthly payment. Please try again.");
    }
}

// Function for owner to check payment status
// by calling checkMonthlyPayment from the SC, a NFT repossesion is initiated by SC if necessary (reason why it costs gaz)
/* TODO: 
- retrieve the payment status to display it (use getAllLease at worst)
- pop up an alert after retrieving the correct PaymentStatus to print it on screen
*/
async function checkPaymentStatusForm(event) {
    event.preventDefault();

    const carId = parseInt(document.getElementById('statusCarId').value);

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        //calling checkMonthlyPayment on the SC
        const paymentStatut = await walletClient.writeContract({ //fct onlyOwner
            address: contractAddress,
            abi: contractABI,
            functionName: "checkMonthlyPayment",
            args: [carId],
            account: userAccount, //owner's account needed
        });
        
        /*
        // calling checkMonthlyPayment on the SC
        const {request} = await publicClient.simulateContract({ //fct onlyOwner
            address: contractAddress,
            abi: contractABI,
            functionName: "checkMonthlyPayment",
            args: [carId],
            account: userAccount, //owner's account needed
        });

        const hash = await walletClient.writeContract(request);
        console.log("le hash", hash);

        
        
        const { request } = await publicClient.simulateContract({
            address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
            abi: wagmiAbi,
            functionName: 'mint',
            account,
          })
        const hash = await walletClient.writeContract(request)
        

        console.log("affichage du raw paymentStatut : ", paymentStatut);

        let statusMessage;
        if (paymentStatut === 0) {
            statusMessage = "Payment status: On Time";
        } else if (paymentStatut === 1) {
            statusMessage = "Payment status: Late";
        } else if (paymentStatut === 2) {
            statusMessage = "Payment status: Missed";
        } else {
            statusMessage = "Unknown payment status";
        }
        */

        alert("Update the all lease list to see payment status");

    } catch (error) {
        console.error("Error checking payment status:", error);
        alert("Failed to check payment status. Please try again.");
    }
}

// function to terminate lease by calling terminateLease from SC
async function submitTerminateLeaseForm(event) {
    event.preventDefault(); // Prevent page reload on form submission

    // gathering value from the form
    const carId = parseInt(document.getElementById('terminateCarId').value);
    const distanceTravelledEndingLease = parseInt(document.getElementById('distanceTravelledEndingLease').value);

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        // calling terminateLease of SC
        const txHash = await walletClient.writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "terminateLease",
            args: [carId, distanceTravelledEndingLease],
            account: userAccount,
        });

        alert(`Lease for Car ID: ${carId} has been successfully terminated! Transaction hash: ${txHash}`);
    } catch (error) {
        console.error("Error terminating lease:", error);
        alert("Failed to terminate lease. Please try again.");
    }
}

// Function to extend lease by calling extendLease from SC
async function submitExtendLeaseForm(event) {
    event.preventDefault(); // Prevent page reload on form submission

    // gathering from values
    const carId = parseInt(document.getElementById('extendCarId').value);
    const distanceTravelled = parseInt(document.getElementById('extendDistanceTravelled').value);
    const newDriverExperience2 = parseInt(document.getElementById('newDriverExperience2').value);

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        // calling calculateExtensionAmount from SC to get the exact payment amount for lease extension
        const requiredExtensionAmount = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "calculateExtensionAmount",
        args: [carId, newDriverExperience2]
        });

        console.log("Required extension amount:", requiredExtensionAmount);

        // calling extendLease fct from SC with exact amount
        const txHash = await walletClient.writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "extendLease",
            args: [carId, distanceTravelled, newDriverExperience2],
            account: userAccount,
            value: requiredExtensionAmount, // exact amount retreived by requiredExtensionAmount from SC
        });

        alert(`Lease for Car ID: ${carId} has been successfully extended! Transaction hash: ${txHash}`);
    } catch (error) {
        console.error("Error extending lease:", error);
        alert("Failed to extend lease. Please try again.");
    }
}

// function to sign a new lease by calling signNewLease from SC
async function submitSignNewLeaseForm(event) {
    event.preventDefault(); // Prevent page reload on form submission

    if (!walletClient) {
        alert("Please connect your wallet first!");
        return;
    }

    // gathering value from the form
    const oldCarId = parseInt(document.getElementById('oldCarId').value);
    const distanceTravelledNewLease = parseInt(document.getElementById('distanceTravelledNewLease').value);
    const newCarId = parseInt(document.getElementById('newCarId').value);
    const newMileageCap = parseInt(document.getElementById('newMileageCap').value);
    const newContractDuration = parseInt(document.getElementById('newContractDuration').value);
    const newDriverExperience = parseInt(document.getElementById('newDriverExperience').value);

    console.log("Old Car ID:", oldCarId);
    console.log("Distance Travelled:", distanceTravelledNewLease);
    console.log("New Car ID:", newCarId);
    console.log("New Mileage Cap:", newMileageCap);
    console.log("New Contract Duration:", newContractDuration);
    console.log("New Driver Experience:", newDriverExperience);


    try {
        // getting the now monthlyPayment amount buy calling calculateMonthlyQuota from SC
        const monthlyPayment = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "calculateMonthlyQuota",
            args: [newCarId, newDriverExperience, newMileageCap, newContractDuration]
        });

        console.log("retour calculatreMonthlyQuota", monthlyPayment);

        //calculate the payments to made (as it's a new lease you have to pay again the caution)
        const downPayment = BigInt(3) * BigInt(monthlyPayment);
        const totalPayment = BigInt(monthlyPayment) + downPayment;
        console.log('downPayment', downPayment);
        console.log('totalPayment', totalPayment);

        // calling signNewLease fct from SC
        const txHash = await walletClient.writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "signNewLease",
            args: [oldCarId, distanceTravelledNewLease, newCarId, newDriverExperience, newMileageCap, newContractDuration],
            account: userAccount,
            value: totalPayment, // amount in wei of new lease monthly price
        });

        alert(`New lease signed for Car ID: ${newCarId}! Transaction hash: ${txHash}`);
    } catch (error) {
        console.error("Error signing new lease:", error);
        alert("Failed to sign new lease. Please try again.");
    }
}

// exporting functions names to be globally visibles (permit calls from the HTML files)
window.connectWallet = connectWallet;
window.submitCarForm = submitCarForm;
window.loadCars = loadCars;
window.submitLeaseForm = submitLeaseForm;
window.submitConfirmLeaseForm = submitConfirmLeaseForm;
window.submitValidateLeaseForm = submitValidateLeaseForm;
window.loadCarsWithOwners = loadCarsWithOwners;
window.submitMonthlyPaymentForm = submitMonthlyPaymentForm;
window.checkPaymentStatusForm = checkPaymentStatusForm;
window.loadAllLeases = loadAllLeases;
window.submitTerminateLeaseForm = submitTerminateLeaseForm;
window.submitExtendLeaseForm = submitExtendLeaseForm;
window.submitSignNewLeaseForm = submitSignNewLeaseForm;
