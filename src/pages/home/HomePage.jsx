import { useState } from "react";
import { useNflContext } from "../../features/nfl/context/NflContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  MIN_LAST_SEASON,
  MIN_YEARS_PLAYED,
  POSITION_GROUPS,
  POSITIONS,
} from "../../data/const";

export default function HomePage() {
  const { getPlayersAfterYear, getPlayerRoster, getPlayerBio } =
    useNflContext();

  const [started, setStarted] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [excludedGroups, setExcludedGroups] = useState(new Set());
  const [player, setPlayer] = useState({});
  const [teams, setTeams] = useState(new Map());
  const [college, setCollege] = useState("");
  const [hint, setHint] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [answer, setAnswer] = useState("");
  const [win, setWin] = useState(false);

  const excludedPositions = new Set(
    [...excludedGroups].flatMap((group) => POSITION_GROUPS[group]),
  );

  const getPlayer = async () => {
    try {
      let players = await getPlayersAfterYear(MIN_LAST_SEASON);

      if (selectedPosition != "") {
        players = players.filter(
          (player) => player.position == selectedPosition,
        );
      } else {
        players = players.filter(
          (player) => !excludedPositions.has(player.position),
        );
      }

      while (true) {
        const randomIndex = Math.floor(Math.random() * players.length);
        const player = players[randomIndex];
        if (!player) continue;

        if (MIN_YEARS_PLAYED <= player.years_of_experience) {
          return player;
        }
      }
    } catch (error) {
      console.error(error);
      return {};
    }
  };

  const getPlayerTeams = async (player_key) => {
    if (!player_key) return;

    const playerRoster = await getPlayerRoster(player_key);
    if (!playerRoster.data) return;

    const history = new Map();

    for (const season of playerRoster.data) {
      history.set(season.season_year, season.season_team_abbr);
    }

    const years = [...history.keys()].sort((a, b) => a - b);

    for (let year = years[0]; year <= years[years.length - 1]; year++) {
      if (!history.has(year)) {
        history.set(year, "FA");
      }
    }

    setTeams(new Map([...history.entries()].sort((a, b) => a[0] - b[0])));
  };

  const getPlayerCollege = async (player_key) => {
    if (player_key == undefined) return;

    const bio = await getPlayerBio(player_key);
    return bio.data.college_name;
  };

  const loadPLayerData = async () => {
    const player = await getPlayer();
    if (!player) return;

    setPlayer(player);

    await getPlayerTeams(player.player_key);

    const college = await getPlayerCollege(player.player_key);
    setCollege(college);
  };

  const handleStart = () => {
    setStarted(true);
    resetGame();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (showPlayer) {
      resetGame();
    } else {
      checkAnswer();
    }
  };

  const checkAnswer = () => {
    if (answer.length == 0) return;

    const formattedAnswer = answer
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const formattedName = player.display_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    // Get letter differences between guess and answer
    const differences = countDifferences(formattedAnswer, formattedName);

    // Name is mispelled within 2 letters, count as correct
    setWin(differences <= 2);

    setShowPlayer(true);
  };

  const countDifferences = (a, b) => {
    let differences = Math.abs(a.length - b.length);
    const minLength = Math.min(a.length, b.length);

    for (let i = 0; i < minLength; i++) {
      if (a[i] !== b[i]) {
        differences++;
      }
    }

    return differences;
  };

  const resetGame = () => {
    setShowPlayer(false);
    setHint(0);
    setTeams(new Map());
    setCollege("");
    setPlayer({});
    setAnswer("");
    setWin(false);
    loadPLayerData();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      <PositionDropdown
        selectedValue={selectedPosition}
        setSelectedValue={setSelectedPosition}
      />

      {selectedPosition == "" && (
        <PositionExclusionCheckbox
          excludedGroups={excludedGroups}
          setExcludedGroups={setExcludedGroups}
        />
      )}

      {!started ? (
        <button onClick={handleStart}>Start Game</button>
      ) : teams.size == 0 ? (
        <LoadingSpinner />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "flex-start",
          }}
        >
          <TeamsList teams={teams} />
          <PlayerImage player={player} showPlayer={showPlayer} />
          <PlayerInfo
            player={player}
            college={college}
            hint={hint}
            showPlayer={showPlayer}
          />

          <RevealButton
            hint={hint}
            setHint={setHint}
            showPlayer={showPlayer}
            setShowPlayer={setShowPlayer}
          />
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={showPlayer}
            />
            <button type="submit">
              {showPlayer ? "Play Again" : "Submit Answer"}
            </button>
          </form>

          {showPlayer && (
            <p style={{ color: win ? "green" : "red", fontWeight: "bold" }}>
              {win ? "Correct!" : "Incorrect!"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div>
      <FontAwesomeIcon icon={faSpinner} spinPulse size="2xl" />
    </div>
  );
}

function PositionDropdown({ selectedValue, setSelectedValue }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <label htmlFor="options">Show only: </label>
      <select
        id="options"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
      >
        <option value="">-- Any --</option>
        {POSITIONS.map((p) => {
          return (
            <option key={p} value={p}>
              {p}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function PositionExclusionCheckbox({ excludedGroups, setExcludedGroups }) {
  const changeExcludedPosition = (e, positionGroup) => {
    setExcludedGroups((prev) => {
      const next = new Set(prev);

      if (e.target.checked) {
        next.add(positionGroup);
      } else {
        next.delete(positionGroup);
      }

      return next;
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      Don't include:
      {Object.keys(POSITION_GROUPS).map((groupName) => (
        <label key={groupName}>
          <input
            type="checkbox"
            checked={excludedGroups.has(groupName)}
            onChange={(e) => changeExcludedPosition(e, groupName)}
          />
          {groupName.replace("_", " ")}
        </label>
      ))}
    </div>
  );
}

function TeamsList({ teams }) {
  const groupTeams = (teamMap) => {
    const entries = [...teamMap.entries()].sort((a, b) => a[0] - b[0]);

    if (entries.length == 0) {
      return [];
    }

    const groups = [];

    let startYear = entries[0][0];
    let endYear = entries[0][0];
    let currentTeam = entries[0][1];

    for (let i = 1; i < entries.length; i++) {
      const [year, team] = entries[i];

      const consecutive = year === endYear + 1;

      if (team === currentTeam && consecutive) {
        endYear = year;
      } else {
        groups.push({
          team: currentTeam,
          startYear,
          endYear,
        });

        currentTeam = team;
        startYear = year;
        endYear = year;
      }
    }

    groups.push({
      team: currentTeam,
      startYear,
      endYear,
    });

    return groups;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "1em",
      }}
    >
      {groupTeams(teams).map((g, index, arr) => {
        return (
          <>
            <div
              key={`${g.team}-${g.startYear}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img
                src={`/images/logos/${g.team}.png`}
                style={{
                  width: "75px",
                  height: "75px",
                  objectFit: "contain",
                }}
              />
              <p style={{ fontWeight: "bold" }}>
                {g.startYear}
                {g.startYear !== g.endYear && ` - ${g.endYear}`}
              </p>
            </div>
            {index < arr.length - 1 && <FontAwesomeIcon icon={faArrowRight} />}
          </>
        );
      })}
    </div>
  );
}

function PlayerImage({ player, showPlayer }) {
  const image = showPlayer
    ? `https://nflmeta.org${player.headshot_url}`
    : "/images/mystery_player.png";

  return (
    <div>
      <img
        src={image}
        style={{
          width: "125px",
          height: "125px",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

function PlayerInfo({ player, college, hint, showPlayer }) {
  return (
    <div>
      <div>Name: {(3 <= hint || showPlayer) && player.display_name}</div>
      <div>College: {0 < hint && college}</div>
      <div>Position: {2 <= hint && player.position}</div>
    </div>
  );
}

function RevealButton({ hint, setHint, showPlayer, setShowPlayer }) {
  const handleHint = () => {
    if (hint < 3) {
      setHint(hint + 1);

      if (hint == 2) {
        setShowPlayer(true);
      }
    }
  };

  return (
    <button onClick={handleHint} disabled={showPlayer}>
      Reveal {hint == 0 ? "College" : hint == 1 ? "Position" : "Player"}
    </button>
  );
}
