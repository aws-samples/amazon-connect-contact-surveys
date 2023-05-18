import { Alert, AlertProps, Button, ContentLayout, FormField, Header, Input, SpaceBetween } from '@awsui/components-react';
import { Auth } from "@aws-amplify/auth";
import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ForgotPasswordProps {}

const ForgotPassword: FC<ForgotPasswordProps> = () => {
    const [isAlert, setIsAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState<AlertProps.Type>("info");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState("");

    const nav = useNavigate();

    const submit = async () => {
        setSubmitted(true);
        setIsAlert(false);
        Auth.forgotPassword(username).then(data => {
            setIsAlert(true);
            alert("info",`A verification code has been sent to your email address ${data.CodeDeliveryDetails.Destination}.`);
            setSubmitted(false);
            setCodeSent(true);
        })
        .catch(err => {
            setIsAlert(true);
            alert("error", "We could not process your request at this time.");
            setSubmitted(false);
        });
    }

    const resetPassword = async () => {
        setSubmitted(true);
        Auth.forgotPasswordSubmit(username, code, password).then(data => {
            console.log(data);
            setIsAlert(true);
            alert("success", "Your password has been successfully reset. Redirecting...");

            setTimeout(() => {
                nav("/login");
            }, 3000);
        })
        .catch(err => {
            setSubmitted(false);
            
            let errMessage = err.name === "InvalidPasswordException" ? "Password must combine uppercase, lowercase and special characters, and be at least 8 characters long." : "Unexpected error - try again later."

            setIsAlert(true);
            alert("error", errMessage);
        })
    }

    const alert = (type: AlertProps.Type, message: string) => {
        setAlertType(type);
        setAlertMessage(message);
    }

    return (
        <div className="authentication-container">
        <ContentLayout
            header={
                <SpaceBetween size="m">
                    <Header variant="h1" description="Please enter your username to initiate a password reset.">
                        Forgot password
                    </Header>

                    {isAlert && <Alert type={alertType}>{alertMessage}</Alert>}
                </SpaceBetween>
            }
        >
            <form onSubmit={(e) => e.preventDefault()}>
                <SpaceBetween size="m">
                    <FormField label="Username">
                        <Input value={username} disabled={codeSent || submitted} onChange={(event) => setUsername(event.detail.value)}></Input>
                    </FormField>
                    { codeSent && (
                        <FormField label="Code">
                            <Input value={code} disabled={submitted} onChange={(event) => setCode(event.detail.value)}></Input>
                        </FormField>
                    ) }
                    { codeSent && (
                        <FormField label="New Password">
                            <Input value={password} type="password" disabled={submitted} onChange={(event) => setPassword(event.detail.value)}></Input>
                        </FormField>
                    ) }
                    <div className="actions">
                        <Button disabled={submitted} variant="primary" onClick={codeSent ? resetPassword : submit}>
                            Submit
                        </Button>
                    </div>
                </SpaceBetween>
            </form>
        </ContentLayout>
    </div>
    );
}

export default ForgotPassword;
