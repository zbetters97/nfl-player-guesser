import { useEffect, useState } from "react";
import { useNflContext } from "../../features/nfl/context/NflContext";

export default function HomePage() {
  const { getPlayers, getPlayerRoster, getPlayerBio } = useNflContext();

  const [player, setPlayer] = useState({});
  const [teams, setTeams] = useState(new Map());
  const [college, setCollege] = useState("");
  const [hint, setHint] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [answer, setAnswer] = useState("");
  const [win, setWin] = useState(false);

  const getPlayerRecord = async () => {
    try {
      const players = await getPlayers();

      const MIN_YEARS_PLAYED = 5;

      while (true) {
        const randomIndex = Math.floor(Math.random() * players.length);
        const player = players[randomIndex];

        if (
          player &&
          2015 < player.last_season &&
          MIN_YEARS_PLAYED <= player.years_of_experience
        ) {
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
    const player = await getPlayerRecord();
    if (!player) return;

    setPlayer(player);

    await getPlayerTeams(player.player_key);

    const college = await getPlayerCollege(player.player_key);
    setCollege(college);
  };

  useEffect(() => {
    loadPLayerData();
  }, []);

  function groupTeams(teamMap) {
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
  }

  const handleClick = () => {
    if (hint < 3) {
      setHint(hint + 1);

      if (hint == 2) {
        setShowPlayer(true);
      }
    }
  };

  const handleSubmit = () => {
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
      .replace(/[^a-z0-9]/g, "")
      .toLowerCase();
    const formattedName = player.display_name
      .trim()
      .replace(/[^a-z0-9]/g, "")
      .toLowerCase();
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

  return player == {} || teams.size == 0 ? (
    <div>Loading...</div>
  ) : (
    <div>
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
                  width="65px"
                  height="50px"
                />
                {g.startYear}
                {g.startYear !== g.endYear && ` - ${g.endYear}`}
              </span>
              {index < arr.length - 1 && " -> "}
            </div>
          );
        })}
      </div>
      <div>
        <img
          src={
            showPlayer
              ? `https://nflmeta.org${player.headshot_url}`
              : "/images/mystery_player.png"
          }
          width="100px"
          height="75px"
        />
        <div>Name: {(3 <= hint || showPlayer) && player.display_name}</div>
      </div>

      <div>College: {0 < hint && college}</div>
      <div>Position: {2 <= hint && player.position}</div>

      {hint < 3 && (
        <button onClick={handleClick}>
          Reveal {hint == 0 ? "College" : hint == 1 ? "Position" : "Player"}
        </button>
      )}
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button onClick={handleSubmit}>
        {showPlayer ? "Play Again" : "Submit Answer"}
      </button>
      {win && <p>Success!</p>}
    </div>
  );
}
