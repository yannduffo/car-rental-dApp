# Web interface for Assignment 3 TTM4195 (Bilboyd Car Rental Web Interface)

## Project Overview

This is a decentralized web application built for managing car rentals using Ethereum smart contracts. The application interacts with a deployed smart contract on the blockchain, where each car is represented by an NFT. Users can lease cars, and the administrator (car owner) can manage the inventory. The site uses Vite as a development environment and the ethers and viem libraries to connect to the Ethereum testnet blockchain.

## Project Structure

- `index.html` - Client interface where users can view available cars and initiate leases.
- `admin.html` - Administrator panel for the car owner to create new cars and manage the car inventory.
- `script.js` - Core JavaScript file containing functions for interacting with the Ethereum smart contract.
- `styles.css` - Stylesheet for the layout and styling of both the client and admin interfaces.
- `contractABI.json`- Storing the contract ABI to be imported into script.js

## Pages and Functionality

### Customer Page (index.html)

Upon loading the main page, clients can:

- _Connect Wallet_ : Connect your wallet by clicking the "Connect Wallet" button. Once connected, the wallet address displays on the page.
- _View Cars_ : Click "Load Car List" to view the list of all cars.
- _Lease a Car_ : Fill in the Car ID, driver experience, mileage cap, and contract duration. Click "Lease Car" to initiate the leasing process.
- _Get the Key_ : For an already created lease, after the lease has been confirmed by BylBoyd, the customers can retrieve the car's NFT key by entering the Car ID and clicking "Get the Key."
- _Make Monthly Payment_ : Enter the Car ID and click "Submit Payment" to make a monthly payment for an active lease. Payment amount is calculated automatically.
- _Terminate Lease_ : Enter the Car ID and distance traveled to terminate an active lease and return the car's NFT to the admin.
- _Extend Lease (1 Year)_ : Enter the Car ID, distance traveled, and updated driver experience to extend the lease by one year. Making the 1st payment automatically
- _Sign New Lease_ : Enter details for both the old lease (Car ID, distance traveled) and the new lease (Car ID, mileage cap, contract duration, and driver experience) to terminate the current lease and start a new one.

Once submitted, the lease form initiates a transaction to the smart contract, enabling users to lease the car by paying a down payment and the first month’s rental fee.

### Admin Page (admin.html)

Accessible through a link in the header of the main page, the admin page allows the car owner to:

- _Connect Wallet_ : Connect the wallet to access admin features, with the wallet address displayed on the page. To access admin feature, Owner's wallet should be connected.
- _Create a New Car_ : Enter car details, including model, color, year, and original value. Click "Create Car" to add a new car to the inventory.
- _View All Cars_ : Click "Load Car List" to display a list of all cars.
- _Confirm Lease_ : Enter the Car ID and click "Confirm Lease" to approve a pending lease request. After that approbation, the customer can ask for the keys.
- _View All Lease Contracts_ : Click "Load All Leases" to view the details of all leases, regardless of their state.
- _View Car Owners_ : Click "Load Car Owners" to view the current owners of each car, displaying the lessee addresses.
- _Check Payment Status_ : Enter the Car ID and click "Check Status" to review the payment status of a car lease, including any missed or late payments. Engage automatically a procedure to get the NFT back if too many payment have been missed.

### The script.js file

This JavaScript file contains the logic for all interactions between the frontend and the smart contract.

Key Functions :

- _connectWallet()_: Connects the user's MetaMask wallet.
- _submitCarForm(event)_: Creates a new car in the admin panel.
- _loadCars()_: Loads and displays all cars in the system.
- _submitLeaseForm(event)_: Initiates a new lease for a car by the customer.
- _submitValidateLeaseForm(event)_: Validates and transfers ownership of a leased car.
- _submitMonthlyPaymentForm(event)_: Submits a monthly payment for a lease.
- _submitTerminateLeaseForm(event)_: Terminates a lease, returning the NFT to the admin.
- _submitExtendLeaseForm(event)_: Extends an active lease by one year.
- _submitSignNewLeaseForm(event)_: Terminates an old lease and signs a new lease.
- _loadAllLeases()_: Displays all leases, regardless of state, in the admin panel.
- _loadCarsWithOwners()_: Displays car ownership information in the admin panel.
- _checkPaymentStatusForm(event)_: Checks and displays the payment status for a specific lease.
- ...

## Development Setup

Install Dependencies: Ensure vite, ethers, and viem are installed by running:

`npm install vite ethers viem`

Run Local Server: Use Vite’s development server for a local preview:

`npx vite`

Server runs on : `localhost:5173`
