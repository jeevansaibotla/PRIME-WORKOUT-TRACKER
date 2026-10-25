export type LibraryExercise = { name: string; muscle: string; equipment: string };

const mk = (muscle: string) => (equipment: string, ...names: string[]): LibraryExercise[] =>
  names.map((name) => ({ name, muscle, equipment }));

const chest = mk("Chest");
const back = mk("Back");
const shoulders = mk("Shoulders");
const biceps = mk("Biceps");
const triceps = mk("Triceps");
const forearms = mk("Forearms");
const quads = mk("Quads");
const hamstrings = mk("Hamstrings");
const glutes = mk("Glutes");
const calves = mk("Calves");
const core = mk("Core");
const traps = mk("Traps");
const neck = mk("Neck");
const fullBody = mk("Full Body");
const cardio = mk("Cardio");

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ---------- CHEST ----------
  ...chest("Barbell", "Bench Press", "Incline Bench Press", "Decline Bench Press", "Close Grip Bench Press", "Floor Press", "Guillotine Press"),
  ...chest("Dumbbell", "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Dumbbell Press", "Dumbbell Fly", "Incline Dumbbell Fly", "Dumbbell Pullover", "Squeeze Press"),
  ...chest("Machine", "Chest Press Machine", "Incline Chest Press Machine", "Pec Deck", "Hammer Strength Press", "Smith Machine Bench Press"),
  ...chest("Cable", "Cable Fly", "Low to High Cable Fly", "High to Low Cable Fly", "Cable Crossover", "Single Arm Cable Press"),
  ...chest("Bodyweight", "Push Up", "Incline Push Up", "Decline Push Up", "Diamond Push Up", "Wide Push Up", "Archer Push Up", "Chest Dip", "Ring Push Up"),

  // ---------- BACK ----------
  ...back("Barbell", "Deadlift", "Barbell Row", "Pendlay Row", "Yates Row", "Rack Pull", "T-Bar Row", "Meadows Row"),
  ...back("Dumbbell", "One Arm Dumbbell Row", "Chest Supported Dumbbell Row", "Dumbbell Pullover", "Incline Dumbbell Row", "Kroc Row"),
  ...back("Cable", "Lat Pulldown", "Wide Grip Lat Pulldown", "Close Grip Lat Pulldown", "Reverse Grip Pulldown", "Seated Cable Row", "Straight Arm Pulldown", "Single Arm Cable Row", "Face Pull"),
  ...back("Machine", "Machine Row", "Hammer Strength Pulldown", "Assisted Pull Up Machine", "Back Extension Machine", "Smith Machine Row"),
  ...back("Bodyweight", "Pull Up", "Chin Up", "Neutral Grip Pull Up", "Inverted Row", "Australian Pull Up", "Superman Hold", "Back Extension"),

  // ---------- SHOULDERS ----------
  ...shoulders("Barbell", "Overhead Press", "Push Press", "Behind The Neck Press", "Barbell Upright Row", "Landmine Press"),
  ...shoulders("Dumbbell", "Seated Dumbbell Press", "Standing Dumbbell Press", "Arnold Press", "Lateral Raise", "Front Raise", "Rear Delt Fly", "Bent Over Lateral Raise", "Cuban Press", "Y Raise"),
  ...shoulders("Cable", "Cable Lateral Raise", "Cable Front Raise", "Cable Rear Delt Fly", "Cable Upright Row"),
  ...shoulders("Machine", "Shoulder Press Machine", "Reverse Pec Deck", "Smith Machine Shoulder Press"),
  ...shoulders("Bodyweight", "Pike Push Up", "Handstand Push Up", "Wall Walk"),

  // ---------- TRAPS / NECK ----------
  ...traps("Barbell", "Barbell Shrug", "Behind The Back Shrug"),
  ...traps("Dumbbell", "Dumbbell Shrug", "Farmer Shrug"),
  ...traps("Cable", "Cable Shrug", "Cable Face Pull to Neck"),
  ...traps("Machine", "Machine Shrug"),
  ...neck("Bodyweight", "Neck Flexion", "Neck Extension", "Neck Side Flexion"),

  // ---------- BICEPS ----------
  ...biceps("Barbell", "Barbell Curl", "EZ Bar Curl", "Reverse Barbell Curl", "Drag Curl", "21s Curl"),
  ...biceps("Dumbbell", "Dumbbell Curl", "Hammer Curl", "Incline Dumbbell Curl", "Concentration Curl", "Zottman Curl", "Cross Body Hammer Curl", "Spider Curl"),
  ...biceps("Cable", "Cable Curl", "Rope Hammer Curl", "High Cable Curl", "Single Arm Cable Curl"),
  ...biceps("Machine", "Preacher Curl", "Machine Bicep Curl"),
  ...biceps("Bodyweight", "Bodyweight Curl", "Chin Up Hold"),

  // ---------- TRICEPS ----------
  ...triceps("Barbell", "Skull Crusher", "Close Grip Bench Press", "JM Press", "Barbell Overhead Extension"),
  ...triceps("Dumbbell", "Overhead Triceps Extension", "Dumbbell Kickback", "Lying Dumbbell Extension", "Tate Press"),
  ...triceps("Cable", "Triceps Pushdown", "Rope Pushdown", "Overhead Rope Extension", "Reverse Grip Pushdown", "Single Arm Pushdown"),
  ...triceps("Machine", "Triceps Dip Machine", "Assisted Dip Machine"),
  ...triceps("Bodyweight", "Triceps Dip", "Bench Dip", "Diamond Push Up"),

  // ---------- FOREARMS ----------
  ...forearms("Barbell", "Barbell Wrist Curl", "Reverse Wrist Curl", "Behind Back Wrist Curl"),
  ...forearms("Dumbbell", "Dumbbell Wrist Curl", "Wrist Roller"),
  ...forearms("Bodyweight", "Dead Hang", "Plate Pinch Hold", "Towel Hang"),

  // ---------- QUADS ----------
  ...quads("Barbell", "Back Squat", "Front Squat", "Pause Squat", "Box Squat", "Zercher Squat", "Barbell Lunge", "Split Squat"),
  ...quads("Dumbbell", "Goblet Squat", "Bulgarian Split Squat", "Dumbbell Lunge", "Walking Lunge", "Step Up"),
  ...quads("Machine", "Leg Press", "Hack Squat", "Leg Extension", "Smith Machine Squat", "Pendulum Squat", "Sissy Squat Machine"),
  ...quads("Bodyweight", "Bodyweight Squat", "Jump Squat", "Wall Sit", "Pistol Squat", "Sissy Squat"),

  // ---------- HAMSTRINGS ----------
  ...hamstrings("Barbell", "Romanian Deadlift", "Stiff Leg Deadlift", "Good Morning", "Sumo Deadlift"),
  ...hamstrings("Dumbbell", "Dumbbell Romanian Deadlift", "Single Leg RDL"),
  ...hamstrings("Machine", "Lying Leg Curl", "Seated Leg Curl", "Glute Ham Raise"),
  ...hamstrings("Bodyweight", "Nordic Curl", "Slider Leg Curl"),

  // ---------- GLUTES ----------
  ...glutes("Barbell", "Hip Thrust", "Glute Bridge", "Sumo Squat"),
  ...glutes("Dumbbell", "Dumbbell Hip Thrust", "Curtsy Lunge", "Dumbbell Step Up"),
  ...glutes("Cable", "Cable Kickback", "Cable Pull Through", "Cable Abduction"),
  ...glutes("Machine", "Hip Abduction Machine", "Hip Adduction Machine", "Glute Kickback Machine"),
  ...glutes("Bodyweight", "Glute Bridge", "Single Leg Glute Bridge", "Frog Pump", "Fire Hydrant"),

  // ---------- CALVES ----------
  ...calves("Machine", "Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise", "Smith Machine Calf Raise"),
  ...calves("Dumbbell", "Dumbbell Calf Raise", "Single Leg Calf Raise"),
  ...calves("Bodyweight", "Bodyweight Calf Raise", "Calf Jump", "Tibialis Raise"),

  // ---------- CORE ----------
  ...core("Bodyweight", "Plank", "Side Plank", "Hollow Body Hold", "Hanging Leg Raise", "Hanging Knee Raise", "Crunch", "Bicycle Crunch", "Reverse Crunch", "V-Up", "Sit Up", "Flutter Kick", "Mountain Climber", "Dead Bug", "Bird Dog", "Toes to Bar", "L-Sit", "Dragon Flag"),
  ...core("Weighted", "Weighted Plank", "Weighted Crunch", "Weighted Sit Up", "Suitcase Carry", "Plate Russian Twist"),
  ...core("Cable", "Cable Crunch", "Cable Woodchopper", "Pallof Press", "Cable Side Bend"),
  ...core("Machine", "Ab Crunch Machine", "Torso Rotation Machine", "Captain's Chair Leg Raise"),
  ...core("Barbell", "Ab Rollout", "Barbell Russian Twist", "Landmine Twist"),

  // ---------- FULL BODY / OLYMPIC ----------
  ...fullBody("Barbell", "Clean & Press", "Power Clean", "Hang Clean", "Snatch", "Thruster", "Clean & Jerk", "Overhead Squat"),
  ...fullBody("Dumbbell", "Dumbbell Thruster", "Dumbbell Snatch", "Devil Press", "Man Maker", "Farmer Carry"),
  ...fullBody("Kettlebell", "Kettlebell Swing", "Turkish Get Up", "Kettlebell Clean", "Kettlebell Snatch", "Goblet Clean"),
  ...fullBody("Bodyweight", "Burpee", "Bear Crawl", "Sled Push", "Battle Rope Slam", "Tire Flip"),

  // ---------- CARDIO ----------
  ...cardio("Machine", "Treadmill Run", "Incline Treadmill Walk", "Stationary Bike", "Rowing Machine", "Stair Climber", "Elliptical", "Assault Bike", "Ski Erg"),
  ...cardio("Bodyweight", "Jump Rope", "High Knees", "Shadow Boxing", "Box Jump", "Sprint Intervals"),
];

export const MUSCLE_GROUPS = Array.from(
  new Set(EXERCISE_LIBRARY.map((e) => e.muscle)),
).sort();

export const EQUIPMENT_TYPES = Array.from(
  new Set(EXERCISE_LIBRARY.map((e) => e.equipment)),
).sort();
