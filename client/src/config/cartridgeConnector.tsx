import { Connector } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { ControllerOptions } from "@cartridge/controller";
import { constants } from "starknet";
import { manifest } from "./manifest";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

console.log("🔧 Environment Configuration:", {
  deployType: VITE_PUBLIC_DEPLOY_TYPE,
  manifestLoaded: !!manifest,
  contractsInManifest: manifest?.contracts?.length || 0
});

const getRpcUrl = () => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "localhost":
        return "http://localhost:5050"; // Katana localhost default port
    case "mainnet":
        return "https://api.cartridge.gg/x/starknet/mainnet";
    case "sepolia":
        return "https://api.cartridge.gg/x/starknet/sepolia";
    default:
        return "https://api.cartridge.gg/x/starknet/sepolia";
  }
};

const getDefaultChainId = () => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "localhost":
        return "0x4b4154414e41"; // KATANA in ASCII
    case "mainnet":
        return constants.StarknetChainId.SN_MAIN;
    case "sepolia":
        return constants.StarknetChainId.SN_SEPOLIA;
    default:
        return constants.StarknetChainId.SN_SEPOLIA;
  }
};

const getGameContractAddress = () => {
  if (!manifest || !manifest.contracts || manifest.contracts.length === 0) {
    console.error("❌ No contracts found in manifest!");
    throw new Error("No game contracts found in manifest");
  }
  return manifest.contracts[0].address;
};

let CONTRACT_ADDRESS_GAME: string;
try {
  CONTRACT_ADDRESS_GAME = getGameContractAddress();
  console.log("✅ Using game contract address:", CONTRACT_ADDRESS_GAME);
} catch (error) {
  console.error("❌ Failed to get game contract address:", error);
  // Fallback - will cause issues but allows app to load
  CONTRACT_ADDRESS_GAME = "0x0";
}

const policies = {
  contracts: {
    [CONTRACT_ADDRESS_GAME]: {
      methods: [
        { name: "spawn_player", entrypoint: "spawn_player" },
        { name: "mark_player_as_created", entrypoint: "mark_player_as_created" },
        { name: "mine", entrypoint: "mine" },
        { name: "rest", entrypoint: "rest" },
        { name: "train_dribbling", entrypoint: "train_dribbling" },
        { name: "train_shooting", entrypoint: "train_shooting" },
        { name: "train_energy", entrypoint: "train_energy" },
        { name: "restore_stamina", entrypoint: "restore_stamina" },
        { name: "add_stamina", entrypoint: "add_stamina" },
        { name: "remove_stamina", entrypoint: "remove_stamina" },
        { name: "improve_charisma", entrypoint: "improve_charisma" },
        { name: "improve_fame", entrypoint: "improve_fame" },
      ],
    },
  },
}

const rpcUrl = getRpcUrl();
const chainId = getDefaultChainId();

console.log("🌐 Cartridge Connector Configuration:", {
  rpcUrl,
  chainId,
  namespace: "full_starter_react",
  slot: "full-starter-react",
  contractAddress: CONTRACT_ADDRESS_GAME,
  policiesCount: Object.keys(policies.contracts).length
});

const options: ControllerOptions = {
  chains: [{ rpcUrl }],
  defaultChainId: chainId,
  policies,
  namespace: "full_starter_react",
  slot: "full-starter-react",
};

let cartridgeConnector: Connector;

try {
  cartridgeConnector = new ControllerConnector(options) as never as Connector;
  console.log("✅ Cartridge connector created successfully");
} catch (error) {
  console.error("❌ Failed to create Cartridge connector:", error);
  throw error;
}

export default cartridgeConnector;
