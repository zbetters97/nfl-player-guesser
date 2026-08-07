const MIN_LAST_SEASON = 2015;
const MIN_YEARS_PLAYED = 5;

const POSITIONS = [
  "QB",
  "RB",
  "FB",
  "WR",
  "TE",
  "C",
  "G",
  "T",
  "DE",
  "DT",
  "LB",
  "CB",
  "S",
  "FS",
  "SS",
  "K",
  "P",
  "LS",
];

const POSITION_GROUPS = {
  Offense: ["QB", "RB", "FB", "WR", "TE", "C", "G", "T"],
  Offensive_Line: ["C", "G", "T"],
  Defense: ["DE", "DT", "LB", "CB", "S", "FS", "SS"],
  Special_Teams: ["K", "P", "LS"],
};

export { MIN_LAST_SEASON, MIN_YEARS_PLAYED, POSITIONS, POSITION_GROUPS };
