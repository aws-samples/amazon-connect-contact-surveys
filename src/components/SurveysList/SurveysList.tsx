import { Box, Button, Header, Pagination, Table } from "@awsui/components-react";
import axios from "axios";
import React, { FC, useEffect, useState } from "react";
import { SurveyModel } from "../../models/SurveyModel";
import { Auth } from "@aws-amplify/auth"; 

interface SurveysListProps {
    setSelectedSurvey: (survey: SurveyModel | undefined) => void;
    selectedSurveyId: string | undefined;
    isNewSurvey: boolean;
}

const SurveysList: FC<SurveysListProps> = (props) => {
    const [selectedItems, setSelectedItems] = useState<SurveyModel[]>([]);
    const [surveys, setSurveys] = useState<SurveyModel[]>([]);
    const [displayedSurveys, setDisplayedSurveys] = useState<SurveyModel[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [loading, setLoading] = useState(false);

    var appConfiguration: any = (window as any).app_configuration;

    useEffect(() => {
        setLoading(true);
        fetchSurveys().then((data) => {
            setSurveys(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        setDisplayedSurveys(surveys.slice(0, 5));
    }, [surveys]);

    useEffect(() => {
        if (selectedItems.length === 1) {
            props.setSelectedSurvey(selectedItems[0]);
        }
    }, [selectedItems]);

    useEffect(() => {
        if (props.selectedSurveyId !== selectedItems[0]?.surveyId) {
            if (props.selectedSurveyId === "") {
                setSelectedItems([]);
            } else {
                setLoading(true);
                fetchSurveys().then((data) => {
                    setSurveys(data);
                    let selectedItem: SurveyModel[] = [];
                    
                    if (data.find(o => o.surveyId === props.selectedSurveyId)) {
                        let selectSurvey: SurveyModel = data.find(o => o.surveyId === props.selectedSurveyId)!;
                        selectedItem.push(selectSurvey);
                    }

                    setSelectedItems(selectedItem);
                    setLoading(false);
                });
            }
        }
    }, [props.selectedSurveyId]);

    const paginate = (index: number) => {
        setSelectedItems([]);
        props.setSelectedSurvey(undefined);
        setDisplayedSurveys(surveys.slice((index - 1) * 5, (index - 1) * 5 + 5));
        setCurrentPageIndex(index);
    };

    const refresh = () => {
        setSelectedItems([]);
        props.setSelectedSurvey(undefined);
        setLoading(true);
        fetchSurveys().then((data) => {
            setSurveys(data);
            setLoading(false);
        });
    }

    const fetchSurveys = async () => {
        const jwt = (await Auth.currentSession()).getIdToken().getJwtToken();

        return axios.post(appConfiguration.api_endpoint, { operation: "list" }, { headers: { "Authorization": jwt }}).then((res) => {
            const surveysList: SurveyModel[] = res.data.data.map((o: any) => {
                let questions: string[] = [];
                let questionsKeys = Object.keys(o).filter((k) => k.startsWith("question_"));
                questionsKeys.sort();
                questionsKeys.forEach((key) => {
                    questions.push(o[key]);
                });

                let flags: string[] = [];
                let flagsKeys = Object.keys(o).filter((k) => k.startsWith("flag_"));
                flagsKeys.sort();
                flagsKeys.forEach((key) => {
                    flags.push(o[key]);
                });

                return {
                    surveyId: o.surveyId,
                    surveyName: o.surveyName,
                    min: parseInt(o.min),
                    max: parseInt(o.max),
                    introPrompt: o.introPrompt,
                    outroPrompt: o.outroPrompt,
                    questions: questions,
                    flags: flags,
                };
            });

            return surveysList;
        });
    };

    return (
        <Table
            onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
            selectedItems={selectedItems}
            loading={loading}
            columnDefinitions={[
                {
                    id: "name",
                    header: "Survey name",
                    cell: (e) => e.surveyName,
                },
                {
                    id: "id",
                    header: "Id",
                    cell: (e) => e.surveyId,
                },
                {
                    id: "questions",
                    header: "# questions",
                    cell: (e) => e.questions.length,
                },
            ]}
            items={displayedSurveys}
            loadingText="Loading surveys"
            selectionType="single"
            trackBy="surveyId"
            visibleColumns={["name", "id"]}
            empty={
                <Box textAlign="center" color="inherit">
                    <b>No surveys</b>
                    <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        No surveys to display.
                    </Box>
                </Box>
            }
            header={
                <Header>
                    Published surveys{" "}
                    <Button iconName="refresh" variant="icon" onClick={refresh}>
                        OK
                    </Button>
                </Header>
            }
            pagination={
                <Pagination
                    currentPageIndex={currentPageIndex}
                    pagesCount={Math.ceil(surveys.length / 5)}
                    onChange={(event) => {
                        paginate(event.detail.currentPageIndex);
                    }}
                    ariaLabels={{
                        nextPageLabel: "Next page",
                        previousPageLabel: "Previous page",
                        pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
                    }}
                />
            }
        />
    );
};

export default SurveysList;
