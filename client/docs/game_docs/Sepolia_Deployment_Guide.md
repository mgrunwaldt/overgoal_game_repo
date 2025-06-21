# Dojo to Sepolia: A Step-by-Step Deployment Guide

This document outlines the complete process for deploying the Dojo backend contracts and configuring the React frontend to connect to the Starknet Sepolia testnet.

---

## Part 1: Backend Contract Deployment

This section covers deploying your smart contracts to the blockchain.

### Step 1: Get Sepolia Account Credentials

First, you need a funded Starknet account for the Sepolia testnet.

1.  **Create a Wallet:** Use a Starknet wallet like Argent or Braavos.
2.  **Select Sepolia:** Ensure your wallet is set to the "Sepolia Testnet".
3.  **Fund Your Account:** Use a [faucet](https://starknet-faucet.vercel.app/) to get Sepolia ETH and STRK.
4.  **Retrieve Credentials:** From your wallet's settings, securely copy your **Account Address** and **Private Key**. These are essential for the next steps.

### Step 2: Set Deployment Environment Variables

In the terminal window you will use for deployment, export the following variables. This allows the `sozo` tool to sign the deployment transactions on your behalf.

```bash
# Replace with your actual credentials
export STARKNET_RPC_URL="https://api.cartridge.gg/x/starknet/sepolia"
export DEPLOYER_ACCOUNT_ADDRESS="<YOUR_SEPOLIA_ACCOUNT_ADDRESS>"
export DEPLOYER_PRIVATE_KEY="<YOUR_SEPOLIA_PRIVATE_KEY>"
```

### Step 3: Update the World Seed

To ensure your deployment creates a new, unique world, you must change the `seed` value.

1.  **Open the File:** `contract/dojo_sepolia.toml`.
2.  **Change the Seed:** Modify the `seed` value to something new (e.g., `seed = "overgoal_seed_2"`).

### Step 4: Deploy the Contracts

With the environment configured, run the deployment command from the `contract` directory.

```bash
# Navigate to the contract directory
cd contract

# Run the deployment script for Sepolia
scarb run sepolia
```

### Step 5: Capture the World Address

The deployment process will output a lot of information. The most crucial piece is the **`world_address`**. Find the line that looks like this and copy the address:

```
*** World Deployed! World Address: 0x019a021f...
```

---

## Part 2: Torii Indexer Deployment

The Torii indexer provides an efficient way for your client to query blockchain data.

### Step 1: Authenticate with Slot

If you haven't already, log in to Cartridge's deployment service.
```bash
slot auth login
```

### Step 2: Deploy the Torii Instance

Deploy a new Torii instance linked to your newly deployed world.

*   Replace `<instance_name>` with a unique name for your project (e.g., `overgoal-sepolia`).
*   Replace `<world_address>` with the address you captured in Part 1.

```bash
slot deployments create <instance_name> torii --world <world_address> --rpc https://api.cartridge.gg/x/starknet/sepolia
```

### Step 3: Capture the Torii URL

The command will output the details of your new indexer, including its URL. Copy this URL (e.g., `https://api.cartridge.gg/x/your-instance-name/torii`).

---

## Part 3: Frontend Client Configuration

Now, configure your React app to connect to your deployed backend.

### Step 1: Synchronize the Manifest File (The Golden Rule)

This is the most common point of failure. The manifest generated during deployment is the "source of truth," and your client needs an identical copy.

**Action:** Copy the `manifest_sepolia.json` file from `contract/` and use it to **overwrite** the file of the same name in `client/src/config/`.

### Step 2: Create and Configure the Environment File

Your client needs to know the addresses and URLs for the deployed services.

1.  **Create File:** If it doesn't exist, create a file named `.env.local` inside the `client/` directory.
2.  **Add Variables:** Populate the file with the following, filling in the placeholders with the values you've gathered:

    ```env
    # Starknet Node
    VITE_PUBLIC_NODE_URL="https://api.cartridge.gg/x/starknet/sepolia"

    # Torii URL from Part 2
    VITE_PUBLIC_TORII="<your_torii_url>"

    # World Address from Part 1
    VITE_PUBLIC_WORLD_ADDRESS="<your_world_address>"

    # Your Sepolia wallet credentials from Part 1
    VITE_PUBLIC_MASTER_ADDRESS="<your_sepolia_account_address>"
    VITE_PUBLIC_MASTER_PRIVATE_KEY="<your_sepolia_private_key>"

    # Set deployment type
    VITE_PUBLIC_DEPLOY_TYPE="sepolia"
    ```

---

## Part 4: Verification and Validation

With everything configured, it's time to verify the end-to-end connection.

### Step 1: Run the Application

1.  **Navigate** to the `client` directory.
2.  **Install dependencies:** `pnpm install`
3.  **Start the server:** `pnpm run dev`

### Step 2: Verify on a Block Explorer

This is the definitive validation to prove everything is working.

1.  **Perform an Action:** In your running application, click a button that initiates an on-chain transaction (e.g., "Spawn Player" or "Train"). Approve the transaction in your wallet.
2.  **Visit StarkScan:** Go to the [StarkScan Sepolia Explorer](https://sepolia.starkscan.co/).
3.  **Search Your World Address:** Paste your `world_address` (from Part 1) into the search bar.
4.  **Look for an `EventEmitter` Event:** In the "Events" tab for your world contract, you should see a new event appear moments after your transaction is confirmed.

**If you see this event, it confirms that your client successfully sent a transaction that was processed by your live smart contracts. Your setup is correct.** 