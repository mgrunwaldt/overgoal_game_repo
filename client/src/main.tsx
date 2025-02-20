import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import Cover from "./Cover.tsx";

// Dojo related imports
import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from "@dojoengine/sdk/react";
import { SchemaType, schema } from "./typescript/models.gen.ts";
import { setupWorld } from "./typescript/contracts.gen.ts";

import "./index.css";
import { dojoConfig } from "../dojoConfig.ts";
import StarknetProvider from "./starknet-provider.tsx";

function RootComponent({ sdk }: { sdk: any }) {
    const [isConnected, setIsConnected] = useState(false);

    return (
        <StrictMode>
            <DojoSdkProvider
                sdk={sdk}
                dojoConfig={dojoConfig}
                clientFn={setupWorld}
            >
                <StarknetProvider>
                    {!isConnected ? (
                        <Cover onConnect={() => setIsConnected(true)} />
                    ) : (
                        <App />
                    )}
                </StarknetProvider>
            </DojoSdkProvider>
        </StrictMode>
    );
}

/**
 * Initializes and bootstraps the Dojo application.
 * Sets up the SDK, burner manager, and renders the root component.
 *
 * @throws {Error} If initialization fails
 */
async function main() {
    const sdk = await init<SchemaType>(
        {
            client: {
                rpcUrl: dojoConfig.rpcUrl,
                toriiUrl: dojoConfig.toriiUrl,
                relayUrl: dojoConfig.relayUrl,
                worldAddress: dojoConfig.manifest.world.address,
            },
            domain: {
                name: "WORLD_NAME",
                version: "1.0",
                chainId: "KATANA",
                revision: "1",
            },
        },
        schema
    );

    createRoot(document.getElementById("root")!).render(
        <RootComponent sdk={sdk} />
    );
}

main().catch((error) => {
    console.error("Failed to initialize the application:", error);
});
