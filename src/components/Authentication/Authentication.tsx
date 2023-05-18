import { Alert, Button, ContentLayout, Header, SpaceBetween, FormField, Input } from "@awsui/components-react";
import React, { FC, useState } from "react";
import { Auth } from "@aws-amplify/auth";

import "./Authentication.css";
import { useNavigate } from "react-router-dom";
import { BaseKeyDetail } from "@awsui/components-react/internal/events";

interface AuthenticationProps {}

const Authentication: FC<AuthenticationProps> = (props) => {
    const [ user, setUser ] = useState<any>();
    const [isAlert, setIsAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [needPasswordChange, setNeedPasswordChange] = useState(false);

    const nav = useNavigate();

    const login = async () => {
        setSubmitted(true);

        Auth.signIn(username, password)
            .then((data) => {
                setUser(data);
                if (data.challengeName == "NEW_PASSWORD_REQUIRED") {
                    setNeedPasswordChange(true);
                    setSubmitted(false);
                    setIsAlert(true);
                    setAlertMessage("Please change your password.");
                    setPassword("");
                } else {
                    nav("/");
                }
            })
            .catch((err) => {
                setIsAlert(true);
                setAlertMessage(err.message);
                setSubmitted(false);
            });
    };

    const resetPassword = async () => {
        nav("/forgot-password");
    };

    const changePassword = () => {
        setSubmitted(true);
        Auth.completeNewPassword(user, password).then(data => {
            nav("/");
        })
        .catch(err => {
            console.log(err);
            setSubmitted(false);
        });
    }

    const captureEnterKey = (event: CustomEvent<BaseKeyDetail>) => {
        if (event.detail.keyCode === 13) {
            event.stopPropagation();
            event.preventDefault();

            if (username !== "" && password !== "") {
                login();
            }
        }
    }

    return (
        <div className="authentication-container">
            <ContentLayout
                header={
                    <SpaceBetween size="m">
                        <Header variant="h1" description="Please enter your credentials to access the application.">
                            Login
                        </Header>

                        {isAlert && <Alert type="error">{alertMessage}</Alert>}
                    </SpaceBetween>
                }
            >
                {!needPasswordChange && (
                    <form onSubmit={(e) => e.preventDefault()}>
                        <SpaceBetween size="m">
                            <FormField label="Username">
                                <Input value={username} disabled={submitted} onChange={(event) => setUsername(event.detail.value)}></Input>
                            </FormField>
                            <FormField label="Password">
                                <Input
                                    type="password"
                                    onKeyDown={(event => { captureEnterKey(event) })}
                                    disabled={submitted}
                                    value={password}
                                    onChange={(event) => setPassword(event.detail.value)}
                                ></Input>
                            </FormField>
                            <div className="actions">
                                <Button disabled={submitted} variant="link" onClick={resetPassword}>
                                    I forgot my password
                                </Button>
                                <Button disabled={submitted || (username === "" || password === "" )} variant="primary" onClick={login}>
                                    Login
                                </Button>
                            </div>
                        </SpaceBetween>
                    </form>
                )}
                {needPasswordChange && (
                    <form onSubmit={(e) => e.preventDefault()}>
                        <SpaceBetween size="m">
                            <FormField label="New password">
                                <Input disabled={submitted} type="password" value={password} onChange={(event) => setPassword(event.detail.value)}></Input>
                            </FormField>
                            <div className="actions">
                                <Button disabled={submitted} variant="primary" onClick={changePassword}>
                                    Change password
                                </Button>
                            </div>
                        </SpaceBetween>
                    </form>
                )}
            </ContentLayout>
        </div>
    );
};

export default Authentication;
