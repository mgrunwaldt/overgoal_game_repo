// hooks/useStarknetConnect.ts
import { useConnect, useAccount, useDisconnect } from "@starknet-react/core";
import { useState, useCallback, useEffect } from "react";
import useAppStore from "../../zustand/store";

export function useStarknetConnect() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { status, address } = useAccount();
  const [hasTriedConnect, setHasTriedConnect] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Access store actions
  const { resetStore } = useAppStore();

  // Debug connectors on mount
  useEffect(() => {
    console.log("🎮 StarknetConnect Debug Info:", {
      connectorsAvailable: connectors.length,
      connectorDetails: connectors.map(c => ({ id: c.id, name: c.name })),
      currentStatus: status,
      currentAddress: address
    });
  }, [connectors, status, address]);

  const handleConnect = useCallback(async () => {
    console.log("🔄 handleConnect called");
    
    if (connectors.length === 0) {
      console.error("❌ No connectors available!");
      alert("No wallet connectors found. Please check your configuration.");
      return;
    }

    const connector = connectors[0]; // Cartridge connector
    console.log("🎯 Using connector:", {
      id: connector.id,
      name: connector.name,
      available: connector.available
    });

    if (!connector) {
      console.error("❌ No connector found");
      alert("Cartridge connector not found. Please check your setup.");
      return;
    }
    
    try {
      setIsConnecting(true);
      setHasTriedConnect(true);
      console.log("🔗 Attempting to connect controller...");
      console.log("🔧 Connector details:", connector);
      
      const result = await connect({ connector });
      console.log("📡 Connect result:", result);
      console.log("✅ Controller connected successfully");
    } catch (error) {
      console.error("❌ Connection failed:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : "Unknown connection error";
      alert(`Connection failed: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(async () => {
    try {
      console.log("🔌 Disconnecting controller...");
      await disconnect();
      setHasTriedConnect(false);
      
      // Clear all store data on disconnect
      console.log("🧹 Clearing store data on disconnect...");
      resetStore();
      
      console.log("✅ Controller disconnected successfully");
    } catch (error) {
      console.error("❌ Disconnection failed:", error);
    }
  }, [disconnect, resetStore]);

  // Log status changes
  useEffect(() => {
    console.log("🎮 Starknet Connect Status Changed:", {
      status,
      address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
      isConnecting,
      hasTriedConnect,
      availableConnectors: connectors.length
    });

    // Clear store if disconnected
    if (status === "disconnected") {
      console.log("🧹 Status is disconnected, clearing store...");
      resetStore();
    }
  }, [status, address, isConnecting, hasTriedConnect, connectors.length, resetStore]);

  return { 
    status, 
    address,
    isConnecting,
    hasTriedConnect, 
    handleConnect,
    handleDisconnect,
    setHasTriedConnect 
  };
}