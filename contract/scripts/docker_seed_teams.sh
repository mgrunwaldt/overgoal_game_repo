#!/bin/bash

# Seed Initial Teams Script
# This script creates the 3 default teams: Nacional, Lanus, and Peñarol

echo "🌱 Seeding initial teams..."

# Set the profile (adjust if needed)
PROFILE=${1:-dev}

echo "📋 Using profile: $PROFILE"

# Execute the seed_initial_teams function
echo "🎯 Calling seed_initial_teams system..."
sozo execute --rpc-url http://katana:5050 --profile $PROFILE game seed_initial_teams

if [ $? -eq 0 ]; then
    echo "✅ Teams seeded successfully!"
    echo ""
    echo "🏆 Created teams:"
    echo "  1. Dojo United    - Offense: 78, Defense: 75, Intensity: 80 (balanced, high-intensity)"
    echo "  2. Cartridge City - Offense: 85, Defense: 68, Intensity: 72 (offensive)"
    echo "  3. Crystal Pulse  - Offense: 70, Defense: 83, Intensity: 68 (defensive)"
    echo "  4. Cyber Lions    - Offense: 75, Defense: 72, Intensity: 85 (high-intensity)"
    echo "  5. Drakon Core    - Offense: 88, Defense: 65, Intensity: 78 (attack-minded)"
    echo "  6. Galactic Forge - Offense: 74, Defense: 77, Intensity: 76 (balanced, defensive-leaning)"
    echo "  7. Hyper Talons   - Offense: 82, Defense: 66, Intensity: 83 (offense + intensity)"
    echo "  8. Iron Syndicate - Offense: 68, Defense: 86, Intensity: 70 (defensive wall)"
    echo "  9. Neon Strikers  - Offense: 86, Defense: 64, Intensity: 74 (attack focus)"
    echo " 10. Neuro Titans   - Offense: 75, Defense: 78, Intensity: 82 (balanced, intense)"
    echo " 11. Phantom Surge  - Offense: 72, Defense: 80, Intensity: 78 (balanced-defensive)"
    echo " 12. Solar Reign    - Offense: 77, Defense: 74, Intensity: 84 (intensity first)"
    echo " 13. Void Breakers  - Offense: 70, Defense: 85, Intensity: 73 (defensive core)"
    echo " 14. Nova United    - Offense: 78, Defense: 78, Intensity: 79 (balanced all-round)"
    echo ""
    echo "🎮 Teams are now available for selection in the game!"
else
    echo "❌ Failed to seed teams. Check the error above."
    exit 1
fi 