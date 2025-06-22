import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { setupWorld } from "../contracts.gen";
import { dojoConfig } from "../dojoConfig";
import { createDojoStore } from "@dojoengine/sdk";

const dojoStore = createDojoStore();

// Hook for seeding non-match events
export function useSeedNonMatchEventsAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const seedNonMatchEvents = async () => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log("🌱 Seeding non-match events...");
            const result = await game.seedNonMatchEvents(account);
            
            console.log("✅ Non-match events seeded successfully:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to seed non-match events";
            console.error("❌ Error seeding non-match events:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        seedNonMatchEvents,
        isLoading,
        error,
    };
}

// Hook for triggering non-match events
export function useTriggerNonMatchEventAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const triggerNonMatchEvent = async (eventId: number, outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`🎲 Triggering non-match event ${eventId} with outcome ${outcomeId}...`);
            const result = await game.triggerNonMatchEvent(account, eventId, outcomeId);
            
            console.log("✅ Non-match event triggered successfully:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to trigger non-match event";
            console.error("❌ Error triggering non-match event:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        triggerNonMatchEvent,
        isLoading,
        error,
    };
}

// Individual event action hooks
export function useLookForSponsorDealsAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const lookForSponsorDeals = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`💰 Looking for sponsor deals with outcome ${outcomeId}...`);
            const result = await game.lookForSponsorDeals(account, outcomeId);
            
            console.log("✅ Sponsor deals action completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to look for sponsor deals";
            console.error("❌ Error looking for sponsor deals:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        lookForSponsorDeals,
        isLoading,
        error,
    };
}

export function useFreeKickPracticeAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const freeKickPractice = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`⚽ Free kick practice with outcome ${outcomeId}...`);
            const result = await game.freeKickPractice(account, outcomeId);
            
            console.log("✅ Free kick practice completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to practice free kicks";
            console.error("❌ Error practicing free kicks:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        freeKickPractice,
        isLoading,
        error,
    };
}

export function useGoToGymAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const goToGym = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`💪 Going to gym with outcome ${outcomeId}...`);
            const result = await game.goToGym(account, outcomeId);
            
            console.log("✅ Gym session completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to go to gym";
            console.error("❌ Error going to gym:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        goToGym,
        isLoading,
        error,
    };
}

export function useMeditateAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const meditate = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`🧘 Meditating with outcome ${outcomeId}...`);
            const result = await game.meditate(account, outcomeId);
            
            console.log("✅ Meditation completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to meditate";
            console.error("❌ Error meditating:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        meditate,
        isLoading,
        error,
    };
}

export function usePartyAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const party = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`🎉 Partying with outcome ${outcomeId}...`);
            const result = await game.party(account, outcomeId);
            
            console.log("✅ Party completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to party";
            console.error("❌ Error partying:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        party,
        isLoading,
        error,
    };
}

// Additional hooks for remaining events...
export function usePenaltyPracticeAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const penaltyPractice = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`⚽ Penalty practice with outcome ${outcomeId}...`);
            const result = await game.penaltyPractice(account, outcomeId);
            
            console.log("✅ Penalty practice completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to practice penalties";
            console.error("❌ Error practicing penalties:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        penaltyPractice,
        isLoading,
        error,
    };
}

export function useGoToPodcastAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const goToPodcast = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`🎙️ Going to podcast with outcome ${outcomeId}...`);
            const result = await game.goToPodcast(account, outcomeId);
            
            console.log("✅ Podcast appearance completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to go to podcast";
            console.error("❌ Error going to podcast:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        goToPodcast,
        isLoading,
        error,
    };
}

export function useWorkOnSocialMediaAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const workOnSocialMedia = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`📱 Working on social media with outcome ${outcomeId}...`);
            const result = await game.workOnSocialMedia(account, outcomeId);
            
            console.log("✅ Social media work completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to work on social media";
            console.error("❌ Error working on social media:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        workOnSocialMedia,
        isLoading,
        error,
    };
}

export function useVisitParentsHomeAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const visitParentsHome = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`🏠 Visiting parents home with outcome ${outcomeId}...`);
            const result = await game.visitParentsHome(account, outcomeId);
            
            console.log("✅ Parents visit completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to visit parents home";
            console.error("❌ Error visiting parents home:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        visitParentsHome,
        isLoading,
        error,
    };
}

export function useGoForRunAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const goForRun = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`🏃 Going for run with outcome ${outcomeId}...`);
            const result = await game.goForRun(account, outcomeId);
            
            console.log("✅ Run completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to go for run";
            console.error("❌ Error going for run:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        goForRun,
        isLoading,
        error,
    };
}

export function usePlayVideogamesAction() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { account } = useAccount();

    const playVideogames = async (outcomeId: number) => {
        if (!account) {
            setError("No account connected");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { game } = setupWorld(dojoStore);
            
            console.log(`🎮 Playing videogames with outcome ${outcomeId}...`);
            const result = await game.playVideogames(account, outcomeId);
            
            console.log("✅ Gaming session completed:", result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to play videogames";
            console.error("❌ Error playing videogames:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        playVideogames,
        isLoading,
        error,
    };
} 