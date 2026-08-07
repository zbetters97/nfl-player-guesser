export function useNfl() {
  const getTeams = async () => {
    const res = await fetch("/data/teams.json");
    return await res.json();
  };

  const getTeamByAbbr = async () => {
    const teams = await getTeams();
    teams.map((team) => [team.abbr, team]);
  };

  const getPlayers = async () => {
    const res = await fetch("/data/players.json");
    return await res.json();
  };

  const getPlayersAfterYear = async (year) => {
    const res = await fetch("/data/players.json");
    const players = await res.json();
    return players.filter((player) => player.last_season >= year);
  };

  const getPlayerHistory = async (playerKey) => {
    const res = await fetch(
      `http://localhost:3001/api?path=${encodeURIComponent(`players/${playerKey}/career/seasons`)}`,
    );

    return await res.json();
  };

  const getPlayerBio = async (playerKey) => {
    const res = await fetch(
      `http://localhost:3001/api?path=${encodeURIComponent(`players/${playerKey}/bio`)}`,
    );

    return await res.json();
  };

  return {
    getTeams,
    getTeamByAbbr,
    getPlayers,
    getPlayersAfterYear,
    getPlayerHistory,
    getPlayerBio,
  };
}
