module.exports = {
  apps : [{
    name   : "WeddingzAI-Back",
    script : "./dist/src/app.js",
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
