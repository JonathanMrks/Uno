import { createPlayerResponseDto } from './playerDtoFactory.js';

function createGameResponseDto(game) {
    return {
        id: game._id,
        title: game.title,
        rules: game.rules,
        status: game.status,
        players: game.players.map((player) => createPlayerResponseDto(player)),
        last_card: game.last_card,
        current_player_id: game.current_player_id,
        winner: game.winner,
        maxPlayers: game.maxPlayers,
        createdAt: game.createdAt,
    };
}

export { createGameResponseDto };
