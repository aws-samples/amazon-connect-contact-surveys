import React, { useEffect, useState } from "react";
import "./App.css";
import { AppLayout, TopNavigation } from "@awsui/components-react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home/Home";
import logo from "./ico_connect.svg";
import Authentication from "./components/Authentication/Authentication";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import { Auth } from "@aws-amplify/auth";
import Logout from "./components/Logout/Logout";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [utilities, setUtilities] = useState<any[]>([]);

    var appConfiguration: any = (window as any).app_configuration;

    useEffect(() => {
        if (isAuthenticated) {
            setUtilities([
                { type: "button", text: "Logout", href: "/logout", external: false },
            ]);
        } else {
            setUtilities([]);
        }
    }, [isAuthenticated]);

    Auth.configure({
        Auth: {
            userPoolId: appConfiguration.cognito_pool_id,
            userPoolWebClientId: appConfiguration.cognito_client_id,
        },
    });

    const authenticated = (value: boolean) => {
        setIsAuthenticated(value);
    };

    return (
        <div className="App">
            <AppLayout
                navigationHide={true}
                toolsHide={true}
                content={
                    <div>
                        <div className="navigation-container">
                            <TopNavigation
                                utilities={utilities}
                                identity={{
                                    href: "/",
                                    title: "Contact Surveys for Amazon Connect",
                                    logo: {
                                        src: logo,
                                    },
                                }}
                                i18nStrings={{
                                    searchIconAriaLabel: "Search",
                                    searchDismissIconAriaLabel: "Close search",
                                    overflowMenuTriggerText: "More",
                                    overflowMenuTitleText: "More",
                                    overflowMenuBackIconAriaLabel: "Back",
                                    overflowMenuDismissIconAriaLabel: "Close menu",
                                }}
                            />
                        </div>
                        <Router>
                            <Routes>
                                <Route path="/" element={<Home authenticated={authenticated}></Home>}></Route>
                                <Route path="/login" element={<Authentication></Authentication>}></Route>
                                <Route path="/forgot-password" element={<ForgotPassword></ForgotPassword>}></Route>
                                <Route path="/logout" element={<Logout></Logout>}></Route>
                                <Route path="/*" element={<Navigate to={"/"}></Navigate>}></Route>
                            </Routes>
                        </Router>
                    </div>
                }
            />
        </div>
    );
}

export default App;
