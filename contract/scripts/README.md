# Team Seeding Scripts

This directory contains scripts for seeding the initial teams in the Overgoal game.

## Scripts

### 1. `seed_teams.sh` - Seed Teams Only
Seeds the 3 default teams without rebuilding or migrating contracts.

```bash
# Seed teams using dev profile (default)
./scripts/seed_teams.sh

# Seed teams using specific profile
./scripts/seed_teams.sh sepolia
```

### 2. `deploy_and_seed.sh` - Complete Deployment
Builds, migrates, and seeds teams in one command.

```bash
# Complete deployment with dev profile (default)
./scripts/deploy_and_seed.sh

# Complete deployment with specific profile
./scripts/deploy_and_seed.sh sepolia
```

## Default Teams Created

The seeding process creates these 3 teams:

| Team ID | Name | Offense | Defense | Intensity | Description |
|---------|------|---------|---------|-----------|-------------|
| 1 | Nacional | 80 | 80 | 80 | Good in everything |
| 2 | Lanus | 85 | 65 | 65 | Good in offense, medium in rest |
| 3 | Peñarol | 40 | 40 | 40 | Bad in everything |

## Usage Instructions

### Option 1: After Initial Deployment
If you've already deployed your contracts and just want to seed teams:

```bash
cd contract
./scripts/seed_teams.sh
```

### Option 2: Fresh Deployment
For a complete fresh deployment with seeding:

```bash
cd contract
./scripts/deploy_and_seed.sh
```

### Option 3: Manual Seeding
You can also manually seed teams using sozo:

```bash
cd contract
sozo execute --profile dev game seed_initial_teams
```

## Notes

- The seeding function checks if teams already exist to avoid duplicates
- If team ID 1 already exists, the seeding will skip and return early
- Teams are created with predetermined IDs (1, 2, 3) for consistency
- The system owner becomes the initial owner of all seeded teams

## Troubleshooting

### Teams Already Exist
If you see no changes after running the script, the teams might already be seeded. Check your game UI or query the teams directly.

### Permission Errors
Make sure the deploying account has the necessary permissions to create teams.

### Profile Issues
Ensure you're using the correct profile that matches your deployment configuration in `dojo_dev.toml` or `dojo_sepolia.toml`. 