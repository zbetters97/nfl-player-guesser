import { useState } from "react";
import { useNflContext } from "../../features/nfl/context/NflContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function HomePage() {
  const { getPlayers, getPlayerRoster, getPlayerBio } = useNflContext();

  const [started, setStarted] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const [player, setPlayer] = useState({});
  const [teams, setTeams] = useState(new Map());
  const [college, setCollege] = useState("");
  const [hint, setHint] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [answer, setAnswer] = useState("");
  const [win, setWin] = useState(false);

  const getPlayer = async () => {
    try {
      const players = await getPlayers();

      const MIN_LAST_SEASON = 2015;
      const MIN_YEARS_PLAYED = 5;

      while (true) {
        const randomIndex = Math.floor(Math.random() * players.length);
        const player = players[randomIndex];
        if (!player) continue;

        const playerCondition =
          MIN_LAST_SEASON <= player.last_season &&
          MIN_YEARS_PLAYED <= player.years_of_experience &&
          (selectedValue === "" || player.position === selectedValue);

        if (playerCondition) {
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

    for (var year = years[0]; year <= years[years.length - 1]; year++) {
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
    loadPLayerData();
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

    setWin(formattedAnswer == formattedName);

    setShowPlayer(true);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PositionDropdown
        selectedValue={selectedValue}
        setSelectedValue={setSelectedValue}
      />

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
    <div>
      <label htmlFor="options">Show only: </label>
      <select
        id="options"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
      >
        <option value="" disabled>
          -- Any --
        </option>
        <option value="QB">QB</option>
        <option value="RB">RB</option>
        <option value="WR">WR</option>
      </select>
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
    <div style={{ display: "inline-block" }}>
      {groupTeams(teams).map((g, index, arr) => {
        return (
          <div
            key={`${g.team}-${g.startYear}`}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <span
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
              {g.startYear}
              {g.startYear !== g.endYear && ` - ${g.endYear}`}
            </span>
            {index < arr.length - 1 && <FontAwesomeIcon icon={faArrowRight} />}
          </div>
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
