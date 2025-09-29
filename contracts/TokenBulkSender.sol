// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenBulkSender
 * @dev A contract for sending ERC20 tokens to multiple addresses in batches
 * @author grxkun
 */
contract TokenBulkSender is Ownable, ReentrancyGuard {
    uint256 public constant MAX_RECIPIENTS = 1000;
    uint256 public fee = 0.001 ether; // Fee per transaction
    
    event BulkTransfer(
        address indexed token,
        address indexed sender,
        uint256 recipientCount,
        uint256 totalAmount
    );
    
    event FeeUpdated(uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    
    /**
     * @dev Send tokens to multiple recipients
     * @param token The ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send to each recipient
     */
    function bulkSendToken(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable nonReentrant {
        require(recipients.length > 0, "No recipients");
        require(recipients.length <= MAX_RECIPIENTS, "Too many recipients");
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(msg.value >= fee, "Insufficient fee");
        
        IERC20 tokenContract = IERC20(token);
        uint256 totalAmount = 0;
        
        // Calculate total amount needed
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(recipients[i] != address(0), "Invalid recipient address");
            totalAmount += amounts[i];
        }
        
        // Check if sender has enough balance
        require(
            tokenContract.balanceOf(msg.sender) >= totalAmount,
            "Insufficient token balance"
        );
        
        // Check if sender has approved enough tokens
        require(
            tokenContract.allowance(msg.sender, address(this)) >= totalAmount,
            "Insufficient token allowance"
        );
        
        // Transfer tokens to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                tokenContract.transferFrom(msg.sender, recipients[i], amounts[i]),
                "Token transfer failed"
            );
        }
        
        emit BulkTransfer(token, msg.sender, recipients.length, totalAmount);
        
        // Refund excess ETH
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
    }
    
    /**
     * @dev Send equal amounts of tokens to multiple recipients
     * @param token The ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amount Amount to send to each recipient
     */
    function bulkSendEqualAmount(
        address token,
        address[] calldata recipients,
        uint256 amount
    ) external payable nonReentrant {
        require(recipients.length > 0, "No recipients");
        require(recipients.length <= MAX_RECIPIENTS, "Too many recipients");
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value >= fee, "Insufficient fee");
        
        IERC20 tokenContract = IERC20(token);
        uint256 totalAmount = amount * recipients.length;
        
        // Check if sender has enough balance
        require(
            tokenContract.balanceOf(msg.sender) >= totalAmount,
            "Insufficient token balance"
        );
        
        // Check if sender has approved enough tokens
        require(
            tokenContract.allowance(msg.sender, address(this)) >= totalAmount,
            "Insufficient token allowance"
        );
        
        // Transfer tokens to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(
                tokenContract.transferFrom(msg.sender, recipients[i], amount),
                "Token transfer failed"
            );
        }
        
        emit BulkTransfer(token, msg.sender, recipients.length, totalAmount);
        
        // Refund excess ETH
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
    }
    
    /**
     * @dev Update the fee for bulk sending (only owner)
     * @param newFee The new fee amount in wei
     */
    function updateFee(uint256 newFee) external onlyOwner {
        fee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
        emit FeesWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Get the current fee
     */
    function getFee() external view returns (uint256) {
        return fee;
    }
}