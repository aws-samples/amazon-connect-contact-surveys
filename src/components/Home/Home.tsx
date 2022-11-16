import { Button, SpaceBetween } from "@awsui/components-react";
import { Auth } from "@aws-amplify/auth";
import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SurveyModel } from "../../models/SurveyModel";
import Survey from "../Survey/Survey";
import SurveysList from "../SurveysList/SurveysList";

interface HomeProps {
    authenticated: (value: boolean) => void
}

const Home: FC<HomeProps> = (props) => {
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyModel>();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isNewSurvey, setIsNewSurvey] = useState(false);

    const nav = useNavigate();

    useEffect(() => {
        Auth.currentAuthenticatedUser()
            .then((data) => {
                sessionStorage.setItem("jwt", data.signInUserSession.idToken.jwtToken);
                props.authenticated(true);
            })
            .catch((err) => {
                nav("/login");
            });
    }, []);

    useEffect(() => {
        if(selectedSurvey?.surveyId !== "") {
            setIsEditMode(false);
            setIsNewSurvey(false);
        } else {
            setIsEditMode(true);
            setIsNewSurvey(true);
        }  
    }, [selectedSurvey]);

    useEffect(() => {
        if (!isEditMode && selectedSurvey?.surveyId === "") {
            setSelectedSurvey(undefined);
        }
    }, [isEditMode])

    const createSurvey = () => {
        let newSurvey: SurveyModel = {
            surveyId: "",
            surveyName: "",
            min: 0,
            max: 9,
            introPrompt: "",
            outroPrompt: "",
            questions: [],
            flags: []
        }

        setSelectedSurvey(newSurvey);
    };

    return (
        <>
            <SpaceBetween size="l">
                <SpaceBetween direction="horizontal" size="xs" className="flex-align-right">
                    {/* <Button variant="link" disabled={!selectedSurvey || isEditMode}>
                        Delete
                    </Button> */}
                    <Button variant="primary" disabled={isEditMode} onClick={createSurvey}>Create</Button>
                </SpaceBetween>
                <SurveysList selectedSurveyId={selectedSurvey?.surveyId} isNewSurvey={isNewSurvey} setSelectedSurvey={setSelectedSurvey}></SurveysList>
                {selectedSurvey && <Survey survey={selectedSurvey} editable={isEditMode} setEditable={(value) => setIsEditMode(value)}></Survey>}
            </SpaceBetween>
        </>
    );
};

export default Home;
