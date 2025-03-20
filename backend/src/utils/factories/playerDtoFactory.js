function createPlayerResponseDto(player) {
    return {
        user_id: player.user_id,
        username: player.username,
        score: player.score,
        give_up: player.give_up,
        uno: player.uno,
        cardsNum: player.cards.length,
    };
}

export { createPlayerResponseDto };
