import initApp from "./server";
const port = process.env.PORT;
const domain_base = process.env.DOMAIN_BASE

initApp().then((app) => {
    app.listen(port, () => {
        console.log(`App is listening at ${domain_base}`);
    });
});
