const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            req.user = null;
            res.locals.user = null;
            return next();
        }

        try {
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
            res.locals.user = userPayload;
        } catch (error) {
            req.user = null;
            res.locals.user = null;
        }

        return next();
    };
}

module.exports = {
    checkForAuthenticationCookie,
};
