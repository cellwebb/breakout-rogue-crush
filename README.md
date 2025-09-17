# Breakout Rogue Crush

A playable Breakout clone with roguelike/roguelite elements that can be hosted on GitHub Pages.

## Roguelike Elements

- **Procedurally generated levels**: Each level has a randomized brick layout
- **Power-ups**: Collect power-ups to permanently upgrade your abilities
- **Permadeath with persistence**: When you lose all lives, the game ends but your high score is saved
- **Toughness system**: Bricks require multiple hits to destroy (1-3)

## How to Play

1. Use the left and right arrow keys to move your paddle
2. Break all bricks to advance to the next level
3. Collect power-ups that drop from destroyed bricks:
   - 🟩 Green: Extra life
   - 🟪 Purple: Wider paddle
   - 🟨 Yellow: Faster ball
   - 🟦 Blue: Multi ball (bonus points)
4. Don't let the ball fall below your paddle!
5. Press SPACE to restart after game over

## Deployment to GitHub Pages

1. Create a new GitHub repository
2. Push these files to the repository
3. In your repository settings, go to "Pages"
4. Select "Deploy from a branch" and choose your main branch
5. Your game will be available at `https://[username].github.io/[repository-name]/`

## Local Development

Simply open `index.html` in your browser to play locally, or serve the files using a local server:

```bash
# If you have Python installed
python -m http.server 8000

# If you have Node.js installed
npx serve
```

Then open `http://localhost:8000` in your browser.