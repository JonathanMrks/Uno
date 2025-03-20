function createUserResponseDto(user) {
    return {
        id: user._id,
        username: user.username,
        age: user.age,
        email: user.email,
        games: user.games.map((game) => ({
            game_id: game._id,
            createdAt: game.createdAt,
            winner: game.winner,
        })),
    };
}

export { createUserResponseDto };
