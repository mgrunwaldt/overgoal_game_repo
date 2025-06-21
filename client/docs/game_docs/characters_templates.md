## Characters Template

The player will be able to select between multiple characters with different traits, foe example :

charactrer 1 , 40 dribblin, 70 shoot, 80 charisma
character 2 , 80 dribbing, 60 shoot, 10 charisma

Lets create in the cairo code a way of creating diffrents types of characters

## important

Think step by step before doing any changes
Use Sensei MCP to create any code related to cairo and dojoengine

# Character Selection System Guide

## 🎯 Overview

This guide outlines the implementation of a character selection system for our Dojo-based football game. Players will choose from predefined character templates, each with unique starting attributes that influence their gameplay style and progression paths.

## 🏗️ System Architecture

### Current Player Model Context
Our Player model includes these attributes:
- `shoot`: Shooting skill level
- `dribble`: Dribbling skill level  
- `energy`: Energy/fitness level
- `stamina`: Stamina for actions
- `charisma`: Social interaction ability
- `fame`: Recognition/popularity level
- `experience`: Overall game progression
- `health`: Player condition
- `coins`: In-game currency

## 🎮 Character Templates Design

### Template Categories

#### **Striker** (Offensive Specialist)
```
Starting Stats:
- shoot: 80        // High shooting accuracy
- dribble: 60      // Moderate ball control
- energy: 70       // Good fitness
- stamina: 60      // Standard endurance
- charisma: 40     // Low social skills
- fame: 30         // Unknown player
```

#### **Playmaker** (Technical Specialist)  
```
Starting Stats:
- shoot: 50        // Basic shooting
- dribble: 85      // Excellent ball control
- energy: 75       // High fitness
- stamina: 70      // Good endurance
- charisma: 60     // Good social skills
- fame: 45         // Some recognition
```

#### **Star Player** (Charismatic Leader)
```
Starting Stats:
- shoot: 65        // Good shooting
- dribble: 65      // Good ball control
- energy: 60       // Moderate fitness
- stamina: 50      // Lower endurance
- charisma: 90     // Exceptional charisma
- fame: 80         // High recognition
```

#### **Rookie** (Balanced Beginner)
```
Starting Stats:
- shoot: 45        // Learning shooting
- dribble: 45      // Learning dribbling
- energy: 85       // High young energy
- stamina: 80      // Great endurance
- charisma: 25     // Shy/unknown
- fame: 10         // No recognition
```

## 🛠️ Implementation Strategy

### Phase 1: Data Structure Design

**Character Template Model** (Cairo)
```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct CharacterTemplate {
    #[key]
    pub template_id: u8,           // 1=Striker, 2=Playmaker, 3=Star, 4=Rookie
    pub name: felt252,             // Template name
    pub description: felt252,      // Short description
    pub base_shoot: u32,          // Starting shoot value
    pub base_dribble: u32,        // Starting dribble value
    pub base_energy: u32,         // Starting energy value
    pub base_stamina: u32,        // Starting stamina value
    pub base_charisma: u32,       // Starting charisma value
    pub base_fame: u32,           // Starting fame value
    pub specialty_bonus: u8,      // Special ability identifier
}
```

**Player Selection Tracking**
```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model] 
pub struct PlayerSelection {
    #[key]
    pub owner: ContractAddress,
    pub selected_template: u8,     // Which template was chosen
    pub selection_timestamp: u64,  // When selection was made
    pub is_selection_confirmed: bool, // Has player confirmed choice
}
```

### Phase 2: Character Creation Flow

#### 2.1 Store Layer Functions (Cairo)

**Template Management**
```cairo
// Initialize all character templates (called in constructor)
fn initialize_character_templates(mut self: Store) {
    // Create Striker template
    let striker = CharacterTemplate {
        template_id: 1,
        name: 'Striker',
        description: 'Goal_Scorer',
        base_shoot: 80,
        base_dribble: 60,
        base_energy: 70,
        base_stamina: 60,
        base_charisma: 40,
        base_fame: 30,
        specialty_bonus: 1, // +1 bonus to shooting training
    };
    self.world.write_model(@striker);
    
    // Create other templates...
}

// Create player with selected template
fn create_player_with_template(mut self: Store, template_id: u8) {
    let caller = get_caller_address();
    let template = self.read_character_template(template_id);
    
    let new_player = PlayerTrait::new(
        caller,
        0,   // experience
        100, // health (standard for all)
        0,   // coins (standard for all)
        Timestamp::unix_timestamp_to_day(get_block_timestamp()),
        template.base_shoot,    // Character-specific
        template.base_dribble,  // Character-specific  
        template.base_energy,   // Character-specific
        template.base_stamina,  // Character-specific
        template.base_charisma, // Character-specific
        template.base_fame,     // Character-specific
        false, // Will be marked true after confirmation
    );
    
    self.world.write_model(@new_player);
    
    // Track selection
    let selection = PlayerSelection {
        owner: caller,
        selected_template: template_id,
        selection_timestamp: get_block_timestamp(),
        is_selection_confirmed: false,
    };
    self.world.write_model(@selection);
}
```

#### 2.2 System Layer Functions (Cairo)

**Interface Extension**
```cairo
#[starknet::interface]
pub trait IGame<T> {
    // ... existing methods
    fn select_character_template(ref self: T, template_id: u8);
    fn confirm_character_selection(ref self: T);
    fn get_character_templates(self: @T) -> Array<CharacterTemplate>;
}
```

**Implementation**
```cairo
fn select_character_template(ref self: ContractState, template_id: u8) {
    let mut world = self.world(@"full_starter_react");
    let store = StoreTrait::new(world);
    
    // Validate template exists
    assert(template_id >= 1 && template_id <= 4, 'Invalid template ID');
    
    // Create player with template
    store.create_player_with_template(template_id);
}

fn confirm_character_selection(ref self: ContractState) {
    let mut world = self.world(@"full_starter_react");
    let store = StoreTrait::new(world);
    
    // Mark player as fully created
    store.mark_player_as_created();
    
    // Update selection status
    store.confirm_player_selection();
}
```

### Phase 3: Frontend Integration

#### 3.1 TypeScript Interfaces

```typescript
export interface CharacterTemplate {
    template_id: number;
    name: string;
    description: string;
    base_shoot: number;
    base_dribble: number;
    base_energy: number;
    base_stamina: number;
    base_charisma: number;
    base_fame: number;
    specialty_bonus: number;
}

export interface PlayerSelection {
    owner: string;
    selected_template: number;
    selection_timestamp: number;
    is_selection_confirmed: boolean;
}
```

#### 3.2 React Components

**CharacterSelectionScreen.tsx**
```typescript
const CharacterSelectionScreen = () => {
    const { executeSelectCharacter, canSelectCharacter } = useSelectCharacterAction();
    const { templates, isLoading } = useCharacterTemplates();
    
    const characterTemplates = [
        {
            id: 1,
            name: "Striker",
            description: "Goal-scoring specialist with high shooting accuracy",
            icon: Target,
            stats: { shoot: 80, dribble: 60, energy: 70, stamina: 60, charisma: 40, fame: 30 },
            specialty: "Shooting training gives +1 bonus point",
            color: "from-red-500 to-red-600"
        },
        {
            id: 2, 
            name: "Playmaker",
            description: "Technical master with exceptional ball control",
            icon: Zap,
            stats: { shoot: 50, dribble: 85, energy: 75, stamina: 70, charisma: 60, fame: 45 },
            specialty: "Dribbling training gives +1 bonus point", 
            color: "from-blue-500 to-blue-600"
        },
        {
            id: 3,
            name: "Star Player", 
            description: "Charismatic leader with high fame and social skills",
            icon: Crown,
            stats: { shoot: 65, dribble: 65, energy: 60, stamina: 50, charisma: 90, fame: 80 },
            specialty: "Charisma and fame training give +1 bonus",
            color: "from-yellow-500 to-yellow-600"
        },
        {
            id: 4,
            name: "Rookie",
            description: "Young talent with high energy and potential",
            icon: Spark,
            stats: { shoot: 45, dribble: 45, energy: 85, stamina: 80, charisma: 25, fame: 10 },
            specialty: "All training gives +1 bonus (rapid learning)",
            color: "from-green-500 to-green-600"
        }
    ];
    
    return (
        <div className="character-selection-grid">
            {characterTemplates.map(template => (
                <CharacterCard 
                    key={template.id}
                    template={template}
                    onSelect={() => executeSelectCharacter(template.id)}
                    canSelect={canSelectCharacter}
                />
            ))}
        </div>
    );
};
```

#### 3.3 Game Flow Integration

**Updated Navigation Logic**
```typescript
// In status-bar.tsx or main navigation
const getGameScreen = () => {
    if (!player) return 'login';
    if (!player.is_player_created) return 'character-selection';
    return 'main-game';
};
```

### Phase 4: Specialty Bonuses System

#### 4.1 Enhanced Training Logic

**Template-Specific Training Bonuses**
```cairo
fn train_shooting_with_bonus(mut self: Store) {
    let mut player = self.read_player();
    let selection = self.read_player_selection(player.owner);
    
    // Base training: +5 shoot, +5 experience, -10 stamina
    player.add_shoot(5);
    player.add_experience(5);
    player.remove_stamina(10);
    
    // Template bonus
    match selection.selected_template {
        1 => player.add_shoot(1), // Striker bonus: extra shooting
        4 => player.add_experience(1), // Rookie bonus: extra experience
        _ => {} // Other templates get no shooting bonus
    }
    
    self.world.write_model(@player);
}
```

#### 4.2 Dynamic UI Feedback

**Training Actions with Bonuses**
```typescript
const getTrainingDescription = (action: string, template: number) => {
    const baseDescriptions = {
        shooting: "+5 Shooting, +5 EXP, -10 Stamina",
        dribbling: "+5 Dribbling, +5 EXP",
        // ... other actions
    };
    
    const bonuses = {
        1: { shooting: " (+1 Striker Bonus)" }, // Striker
        2: { dribbling: " (+1 Playmaker Bonus)" }, // Playmaker  
        3: { charisma: " (+1 Star Bonus)", fame: " (+1 Star Bonus)" }, // Star
        4: { all: " (+1 Rookie Bonus)" }, // Rookie
    };
    
    return baseDescriptions[action] + (bonuses[template]?.[action] || bonuses[template]?.all || "");
};
```

## 🎨 UI/UX Design Patterns

### Character Card Design
- **Visual Identity**: Each template has distinct colors and icons
- **Stat Visualization**: Radar chart or progress bars showing relative strengths
- **Specialty Highlight**: Clear indication of unique bonuses
- **Preview Mode**: Show how character will look/perform

### Selection Flow
1. **Template Gallery**: Grid view of all available characters
2. **Detail View**: Expanded stats and specialty information  
3. **Confirmation Step**: Final review before committing choice
4. **Welcome Screen**: Introduction to selected character's journey

## 🔍 Validation Strategy

### Cairo Contract Validation
```cairo
// Verify character template creation works correctly
fn validate_character_template_creation() {
    // Validate template initialization
    // Verify all templates have valid stats
    // Check template retrieval functions
}

fn validate_player_creation_with_template() {
    // Validate player creation with each template
    // Verify stats match template values
    // Check selection tracking
}

fn validate_specialty_bonuses() {
    // Validate training bonuses for each template
    // Verify bonus calculations are correct
    // Check edge cases (stamina = 0, etc.)
}
```

### Frontend Validation
- **Template Selection**: Verify UI shows correct stats and descriptions
- **Navigation Flow**: Check progression from selection to main game
- **Data Persistence**: Ensure selected template persists across sessions
- **Bonus Display**: Verify training actions show template-specific bonuses

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create CharacterTemplate and PlayerSelection models
- [ ] Implement template initialization in store
- [ ] Add template selection system functions
- [ ] Update TypeScript bindings

### Phase 2: Selection UI (Week 2)  
- [ ] Build CharacterSelectionScreen component
- [ ] Create CharacterCard components
- [ ] Implement selection hooks and state management
- [ ] Add navigation logic integration

### Phase 3: Specialty System (Week 3)
- [ ] Enhance training functions with template bonuses
- [ ] Update UI to show dynamic training descriptions  
- [ ] Add specialty indicator in player stats
- [ ] Implement template-specific achievements

### Phase 4: Polish & Validation (Week 4)
- [ ] Comprehensive validation across all templates
- [ ] UI/UX refinements and animations
- [ ] Performance optimization
- [ ] Documentation and guides

## 📊 Success Metrics

- **Selection Distribution**: Are all templates being chosen roughly equally?
- **Engagement by Template**: Do different templates lead to different play patterns?
- **Training Behavior**: Are players utilizing their specialty bonuses?
- **Player Retention**: Does character choice affect long-term engagement?

## ⚠️ Important Implementation Notes

### Using Sensei MCP
- Use Sensei MCP for ALL Cairo/Dojo code generation
- Follow the exact patterns established in our existing codebase
- Maintain consistency with current Player model structure
- Ensure all new models follow the same validation patterns

### Technical Considerations
- **Gas Optimization**: Template data should be stored efficiently
- **Upgradeability**: Design templates to be expandable
- **Security**: Validate template IDs to prevent exploitation
- **State Management**: Ensure selection state is properly tracked

### Design Philosophy
- **Meaningful Choice**: Each template should offer genuinely different gameplay
- **Balanced Progression**: No template should be objectively superior
- **Identity**: Players should feel connected to their chosen character
- **Progression**: Specialties should remain relevant throughout the game

---

This character selection system transforms our simple player creation into an engaging choice that affects the entire gameplay experience. Each template creates a different path through the game while maintaining balance and ensuring all choices remain viable and interesting.