# car-rental-dApp

This repository contains a Solidity-based smart contract for a car leasing system, developed as part of the **TTM4195 - Blockchain and cryptocurrencies** course assignment from **Norwegian University of Science and Technology (NTNU)**. The project demonstrates the use of NFTs and smart contract functionalities to simulate a secure and efficient car leasing system.

## Project Overview

The smart contract **carForRent** introduces a car leasing platform where vehicles are represented as NFTs, enabling transparent and decentralized leasing agreements. The system ensures secure transactions between customers and the dealership, while also handling scenarios like lease termination and extensions.

The web application developed in JS enables interactions with this contract deployed on the Sepolia testnet.

### Key Features of carForRent SC

1. **NFT Representation of Cars**

   - Each car available for lease is represented as an NFT containing:
     - Model
     - Color
     - Year of matriculation
     - Original value

2. **Dynamic Lease Calculation**

   - The monthly lease amount is calculated based on:
     - Original car value
     - Current car mileage
     - Driver’s experience (years with a driving license)
     - Mileage cap
     - Contract duration

3. **Fair Exchange Mechanism**

   - Secure down payment transfer and confirmation through smart contract locking/unlocking mechanisms (using owner/operator NFT proprieties)
   - Monthly payment from lessee

4. **Insolvency Protection**

   - Functionalities to safeguard against non-payment by lessees.

5. **Flexible Lease Termination**
   - Lessees can:
     - Terminate the lease
     - Extend the lease for another year
     - Sign a new lease for a different vehicle

### Web app

The web interface consists of two pages: a **Customer Page** (`./webapp/index.html`) and an **Admin Panel** (`./webapp/admin.html`) and a **scripting file** `./webapp/script.js`.

#### Customer Page

Users can:

- **Connect Wallet**: Authenticate with MetaMask.
- **View Cars**: Display the list of available cars.
- **Lease a Car**: Submit lease details and initiate transactions.
- **Manage Lease**: Make payments, retrieve keys, extend or terminate leases, and start new ones.

#### Admin Panel

Admins can:

- **Connect Wallet**: Access admin features after authentication.
- **Manage Cars**: Create, update, and view all cars in the inventory.
- **Handle Leases**: Approve, monitor, and terminate lease contracts.
- **Check Payment Status**: View and enforce payment compliance.

#### `./webapp/script.js` overview

The `./webapp/script.js` file handles all interactions with the web interface and Ethereum blockchain. It manages wallet connections, form submissions, and dynamic updates to the user interface. It leverages the **ethers.js** and **viem** libraries for secure and efficient interaction with smart contracts and the Ethereum testnet.

## Instructions

### Using existing deployed SC

Depolyed contract address on Sepolia testnet : `0x5bd3a4E94a5F2244F9754C40D8C6548E3cF2dCCC`

Clone repository.

Start web interface by folling `./webapp/readme.md` instructions.

### Deploying new version of the SC

Deploy carForRent on Sepolia testnet (using Remix IDE for example).

Clone repository.

Change contract address with the one freshly deployed on `./webapp/script.js`.

The contract ABI should still be good. If not, change contract ABI by copy/paste the new one in `./webapp/contractABI.json`.

Start web interface by folling `./webapp/readme.md` instructions.

<br>
<br>
<br>
<br>
Created by Yann Duffo, Ilyan Monestier, Pierre Poinas, Tanguy Guyot
