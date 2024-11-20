// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BilBoyd car rental company
 * @author DUFFO Yann, GUYOT Tanguy, MONESTIER-MEZE Ilyan, POINAS Pierre
 * @dev An example contract to demonstrate the principle of car rental via a smart contract for the TTM4195 course
 * @notice This contract is untested
 * @custom:experimental This is an experimental contract for the TTM4195 class.
 *
 *
 * Notes for the developers:
 * - 'onlyOwner' means that only the owner of the contrat can
 *   call this function ;
 * - Storing the metadata on JSON outside the blockchain can drastically
 *   reduce the gas used ;
 * - The current car lessee is represented by the current owner of the NFT ;
 *
 *
 * Useful documentations:
 * - https://docs.openzeppelin.com/contracts/5.x/erc721
 * - https://docs.openzeppelin.com/contracts/5.x/access-control
 * - https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts
 * - https://docs.openzeppelin.com/contracts/5.x/api/utils
 */
contract carForRent is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _carIDCounter;

    constructor(
        address initialOwner
    ) ERC721("carForRent", "CAR") Ownable(initialOwner) {}

    struct Car {
        string model;
        string color;
        uint16 yearOfMatriculation;
        uint256 originalValue;
        uint256 mileage;
    }

    // Mapping each carID to car struct containing all cars
    mapping(uint256 => Car) public _cars;
    // Array to store all car IDs
    uint256[] private carIDs;

    /**
     * @notice Checks if a car with the given ID exists in the `_cars` mapping.
     * @dev Uses the `model` property to determine existence; if `model` is an empty string, the car does not exist.
     * @param carID The unique identifier of the car to check in the `_cars` mapping.
     * @return bool Returns `true` if the car exists, `false` if it does not.
     */
    function carExists(uint256 carID) public view returns (bool) {
        return bytes(_cars[carID].model).length > 0;
    }

    /**
     * @notice Create a new car by minting an NFT
     * @dev Initially, no lessee is assigned. It is going to be the compagny.
     * @param model The model of the car
     * @param color The color of the car
     * @param yearOfMatriculation The year the car was manufactured
     * @param originalValue The original value of the car
     */
    function createCar(
        string memory model,
        string memory color,
        uint16 yearOfMatriculation,
        uint256 originalValue
    ) public onlyOwner returns (uint256) {
        // Get the ID of the new car
        _carIDCounter.increment();
        uint256 carID = _carIDCounter.current();
        // Mint the NFT representing the car
        _mint(msg.sender, carID); // With 'onlyOwner': 'msg.sender' can only be the compagny
        // Store car details in the mapping
        _cars[carID] = Car({
            color: color,
            model: model,
            yearOfMatriculation: yearOfMatriculation,
            originalValue: originalValue,
            mileage: 0 // Initial mileage is set to 0
        });
        // Store the new car ID in the carIDs array
        carIDs.push(carID);
        // Return the ID of the car (the NFT)
        return carID;
    }

    /**
     * @notice Remove a car by burning the NFT
     */
    function burn(uint256 carID) public onlyOwner {
        require(carExists(carID), "Car does not exist");
        //TODO: changer le prochain requires avec la nouvelle structure de location
        //require(ownerOf(carID) == msg.sender, "ERROR: The car must not currently be rented, at the time of removal");
        delete _cars[carID];
        // Remove the ID of `carIDs`
        for (uint256 i = 0; i < carIDs.length; i++) {
            if (carIDs[i] == carID) {
                carIDs[i] = carIDs[carIDs.length - 1]; // Remplace l'ID par le dernier élément
                carIDs.pop(); // Supprime le dernier élément
                break;
            }
        }
        // End by burning the NFT
        _burn(carID);
    }

    /**
     * @notice Retrieve details of a car by its carID.
     * @param carID The unique ID of the car
     * @return car The car struct containing all details
     */
    function getCarDetails(uint256 carID) public view returns (Car memory) {
        require(carExists(carID), "Car does not exist");
        return _cars[carID];
    }

    /**
     * @notice Retrieve details of all cars.
     * @return Car[] An array of Car structs containing the details of all cars
     */
    function getAllCars() public view returns (Car[] memory) {
        Car[] memory allCars = new Car[](carIDs.length);
        for (uint256 i = 0; i < carIDs.length; i++) {
            allCars[i] = _cars[carIDs[i]];
        }
        return allCars;
    }

    /**
     * @notice Calculate the monthly quota for renting the car.
     * @param carOriginalValue The original value of the car
     * @param driverExperience Years of possession of a driving license
     * @param mileageCap The mileage cap (fixed values)
     * @param contractDuration The duration of the contract (fixed values)
     * @return monthlyQuota The calculated monthly quota
     */
    function calculateMonthlyQuota(
        uint256 carOriginalValue,
        uint256 driverExperience,
        uint256 mileageCap,
        uint256 contractDuration
    ) public pure returns (uint256 monthlyQuota) {
        // Useful constants for calculation
        uint256 monthlyBase = (carOriginalValue * 4) / 100; // Base cost: 4% of vehicle value per month
        // Apply discount based on driver experience
        // Each year of experience above 5 year provides a 0.5% discount, capped at 3%
        uint256 experienceDiscount = driverExperience >= 5
            ? (((driverExperience - 5) * 5) / 1000)
            : 0;
        if (experienceDiscount > 3) experienceDiscount = 3; // Cap at 3%
        uint256 discount = (monthlyBase * experienceDiscount) / 100;
        // Adjust cost based on mileage cap
        // For example, if mileageCap is low, apply a small reduction, if high, increase
        uint256 mileageAdjustment;
        if (mileageCap <= 1000) {
            mileageAdjustment = (monthlyBase * 95) / 100; // 5% reduction for low mileage
        } else if (mileageCap <= 2000) {
            mileageAdjustment = monthlyBase; // No change for moderate mileage
        } else {
            mileageAdjustment = (monthlyBase * 110) / 100; // 10% increase for high mileage
        }
        // Adjust cost based on contract duration
        // Longer contracts get a discount, e.g., 5% for 12+ months
        uint256 durationDiscount;
        if (contractDuration >= 12) {
            durationDiscount = (monthlyBase * 5) / 100; // 5% discount for 12+ months
        } else {
            durationDiscount = 0; // No discount for shorter contracts
        }
        // Calculate the final monthly quota
        monthlyQuota =
            monthlyBase -
            discount +
            mileageAdjustment -
            durationDiscount;
        // Return value
        return monthlyQuota;
    }

    enum LeaseState {
        Created,
        Confirmed,
        Running,
        Inactive
    }
    enum PaymentState {
        Late,
        OnTime,
        Missed
    }
    uint256 public lateFee = 100; // GWei
    uint256 public maxMissedPaymentsAllowed = 3;

    struct Lease {
        address lessee;
        uint256 monthlyPayment;
        uint256 downPayment;
        LeaseState state;
        uint256 nextPaymentDueDate;
        uint256 consecutiveMissedPayments;
        PaymentState lastPaymentStatut;
    }

    mapping(uint256 => Lease) public _leases;

    /**
     * @notice Initiate a lease for a car
     * @param carID The ID of the car to lease
     * @param driverExperience The years of possession of a driving license
     * @param mileageCap The mileage cap (fixed values)
     * @param contractDuration The duration of the contract (fixed values)
     */
    function initiateLease(
        uint256 carID,
        uint256 driverExperience,
        uint256 mileageCap,
        uint256 contractDuration
    ) external payable {
        // Compute and verify payment amount
        Car memory car = getCarDetails(carID);
        uint256 monthlyPayment = calculateMonthlyQuota(
            car.originalValue,
            driverExperience,
            mileageCap,
            contractDuration
        );
        uint256 downPayment = 3 * monthlyPayment;
        require(
            msg.value == monthlyPayment + downPayment,
            "Incorrect payment amount"
        );
        // Creation of the lease
        _leases[carID] = Lease({
            lessee: msg.sender,
            monthlyPayment: monthlyPayment,
            downPayment: downPayment,
            state: LeaseState.Created,
            nextPaymentDueDate: (contractDuration <= 1)
                ? type(uint256).max
                : (block.timestamp + 3 minutes),
            consecutiveMissedPayments: 0,
            lastPaymentStatut: PaymentState.OnTime
        });
    }

    /**
     * @notice Confirm a lease for a car
     * @param carId The ID of the car to lease
     */
    function confirmLease(uint256 carId) external onlyOwner {
        // Verify the lease exists and needs to be confirmed
        Lease storage currentLease = _leases[carId];
        require(
            currentLease.lessee != address(0),
            "No lease found for this car"
        );
        require(
            currentLease.state == LeaseState.Created,
            "Lease is not in the right state"
        );
        // Confirm the lease by passing currentLease.state from 'Created' to 'Running'
        currentLease.state = LeaseState.Confirmed;

        setApprovalForAll(currentLease.lessee, true);
    }

    function validateLease(uint256 carId) external {
        Lease storage currentLease = _leases[carId];
        require(
            currentLease.lessee != address(0),
            "No lease found for this car"
        );
        require(
            currentLease.state == LeaseState.Confirmed,
            "Lease is not in the right state"
        );
        currentLease.state = LeaseState.Running;
        safeTransferFrom(owner(), currentLease.lessee, carId);
        payable(owner()).transfer(
            currentLease.downPayment + currentLease.monthlyPayment
        );
        setApprovalForAll(owner(), true);
    }

    /**
     * @notice Retrieve all lease contracts, regardless of their state.
     * @return Lease[] An array of Lease structs containing all lease details.
     */
    function getAllLeases() public view onlyOwner returns (Lease[] memory) {
        Lease[] memory allLeases = new Lease[](carIDs.length);
        for (uint256 i = 0; i < carIDs.length; i++) {
            allLeases[i] = _leases[carIDs[i]];
        }
        return allLeases;
    }

    /**
     * @notice Calculate the total monthly payment required, including any late fees if applicable.
     * @param carId The ID of the leased car
     * @return uint256 The required payment amount in wei
     */
    function calculateMonthlyPaymentAmount(
        uint256 carId
    ) public view returns (uint256) {
        Lease storage currentLease = _leases[carId];
        require(
            currentLease.lessee != address(0),
            "No lease found for this car"
        );
        require(
            currentLease.state == LeaseState.Running,
            "Lease has not been confirmed yet"
        );

        uint256 requiredPayment = currentLease.monthlyPayment;
        if (block.timestamp > currentLease.nextPaymentDueDate) {
            requiredPayment += lateFee;
        }
        return requiredPayment;
    }

    /**
     * @notice Lessee interface for monthly payments
     * @param carId The ID of the leased car
     */
    function makeMonthlyPayment(uint256 carId) external payable {
        // Retrieve the lease associated with the car
        Lease storage currentLease = _leases[carId];
        // Requirements
        require(
            currentLease.lessee != address(0),
            "No lease found for this car"
        );
        require(
            currentLease.state == LeaseState.Running,
            "Lease has not been confirmed yet"
        );
        require(
            msg.sender == currentLease.lessee,
            "Only the lessee can make a payment"
        );
        // Use cases by date
        uint256 requiredPayment = currentLease.monthlyPayment;

        if (block.timestamp > currentLease.nextPaymentDueDate) {
            // Apply late fee if overdue but within the grace period
            requiredPayment += lateFee;
            currentLease.consecutiveMissedPayments += 1;
        } else {
            // Reset missed payment count if paid on time
            currentLease.consecutiveMissedPayments = 0;
        }
        // Ensure payment is sufficient
        require(msg.value >= requiredPayment, "Insufficient payment");
        // Transfer payment to the owner
        payable(owner()).transfer(requiredPayment);
        // Update the due date for the next payment
        currentLease.nextPaymentDueDate += 3 minutes;
    }

    /**
     *@notice Company interface to check payments made
     *@param carId The ID of the leased car
     */
    function checkMonthlyPayment(
        uint256 carId
    ) external onlyOwner returns (PaymentState state) {
        Lease storage currentLease = _leases[carId];
        require(
            currentLease.lessee != address(0),
            "No lease found for this car"
        );
        require(
            currentLease.state == LeaseState.Running,
            "Lease has not been confirmed yet"
        );
        // Check if missed payment threshold has been exceeded
        if (
            (block.timestamp > currentLease.nextPaymentDueDate + 6 minutes) ||
            (currentLease.consecutiveMissedPayments >= maxMissedPaymentsAllowed)
        ) {
            currentLease.lastPaymentStatut = PaymentState.Missed;
            repossessNFT(carId, currentLease); //if paymentState = Missed : we call the repossessNFT fonction to get the car back to our ownership
        } else if (block.timestamp > currentLease.nextPaymentDueDate) {
            currentLease.lastPaymentStatut = PaymentState.Late;
        } else {
            currentLease.lastPaymentStatut = PaymentState.OnTime;
        }

        return currentLease.lastPaymentStatut; //return current paymentStatus
    }

    // Function to repossess the NFT
    function repossessNFT(uint256 carId, Lease storage currentLease) internal {
        currentLease.state = LeaseState.Inactive;

        // Transfer the NFT back to the owner
        safeTransferFrom(currentLease.lessee, owner(), carId);

        // Reset missed payments for record-keeping purposes
        currentLease.consecutiveMissedPayments = 0;
    }
}
