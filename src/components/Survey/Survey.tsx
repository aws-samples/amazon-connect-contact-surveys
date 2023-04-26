import {
    Box,
    Button,
    Checkbox,
    Container,
    DateRangePicker,
    ExpandableSection,
    Form,
    FormField,
    Header,
    Input,
    PieChart,
    SpaceBetween,
    Tabs,
} from "@awsui/components-react";
import axios from "axios";
import React, { FC, useEffect, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import { SurveyModel } from "../../models/SurveyModel";

interface SurveyProps {
    survey: SurveyModel;
    editable: boolean;
    setEditable: (value: boolean) => void;
}

interface Question {
    text: string;
    flag: boolean;
    threshold: number;
}

const Survey: FC<SurveyProps> = (props) => {
    const [id, setId] = useState("");
    const [title, setTitle] = useState("");
    const [intro, setIntro] = useState("");
    const [outro, setOutro] = useState("");
    const [minimum, setMinimum] = useState(0);
    const [maximum, setMaximum] = useState(9);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [dateRangeFilter, setDateRangeFilter] = React.useState<any>({});

    var appConfiguration: any = (window as any).app_configuration;

    const setIsEditable = (value: boolean) => {
        props.setEditable(value);
    };

    const cancelEdits = () => {
        setId(props.survey.surveyId);
        setTitle(props.survey.surveyName);
        setIntro(props.survey.introPrompt);
        setOutro(props.survey.outroPrompt);
        setMinimum(props.survey.min);
        setMaximum(props.survey.max);
        setQuestionsList(props.survey.questions, props.survey.flags);

        setIsEditable(false);
    };

    useEffect(() => {
        setId(props.survey.surveyId);
        setTitle(props.survey.surveyName);
        setIntro(props.survey.introPrompt);
        setOutro(props.survey.outroPrompt);
        setMinimum(props.survey.min);
        setMaximum(props.survey.max);
        setQuestionsList(props.survey.questions, props.survey.flags);

        fetchResults(props.survey.surveyId);
    }, [props.survey]);

    const setQuestionsList = (questions: string[], flags: number[]) => {
        let questionsList: Question[] = [];
        for (let i = 0; i < questions.length; i++) {
            questionsList.push({
                text: questions[i],
                threshold: flags[i],
                flag: flags[i] !== -1 ? true : false,
            });
        }

        setQuestions(questionsList);
    };

    const updateQuestion = (index: number, text: string, flag: boolean, threshold: number) => {
        let newQuestion: Question = {
            text: text,
            flag: flag,
            threshold: threshold,
        };

        let updatedQuestions = [...questions];
        updatedQuestions[index] = newQuestion;

        setQuestions(updatedQuestions);
    };

    const addQuestion = () => {
        let newQuestion: Question = {
            text: "",
            flag: false,
            threshold: -1,
        };

        let updatedQuestions = [...questions];
        updatedQuestions.push(newQuestion);

        setQuestions(updatedQuestions);
    };

    const removeQuestion = (index: number) => {
        let updatedQuestions = [...questions];
        updatedQuestions.splice(index, 1);

        setQuestions(updatedQuestions);
    };

    const saveSurvey = async () => {
        setSubmitted(true);
        let survey: SurveyModel = {
            surveyId: id,
            surveyName: title,
            introPrompt: intro,
            outroPrompt: outro,
            min: minimum,
            max: maximum,
            questions: [],
            flags: [],
        };

        questions.forEach((question) => {
            survey.questions.push(question.text);
            survey.flags.push(question.flag ? question.threshold : -1);
        });

        const jwt = (await Auth.currentSession()).getIdToken().getJwtToken();

        axios
            .post(
                appConfiguration.api_endpoint,
                { operation: "create", data: survey },
                { headers: { Authorization: jwt } }
            )
            .then((data) => {
                props.setEditable(false);
                setSubmitted(false);
            })
            .catch((err) => {
                console.log(err);
                setSubmitted(false);
            });
    };

    const validateForm = () => {
        if (title === "") {
            return false;
        }

        if (questions.length === 0) {
            return false;
        }

        if (!validateRange()) {
            return false;
        }

        return true;
    };

    const validateRange = () => {
        if (maximum <= minimum || minimum >= maximum) {
            return false;
        }

        return true;
    };

    const getResults = (questionIndex: number) => {
        let formattedResults = [];

        for (let i = minimum; i <= maximum; i++) {
            if (filteredResults.filter((o) => o[`survey_result_${questionIndex + 1}`] == i).length !== 0) {
                formattedResults.push({
                    title: `Score = ${i}`,
                    value: filteredResults.filter((o) => o[`survey_result_${questionIndex + 1}`] == i).length,
                });
            }
        }

        return formattedResults;
    };

    const fetchResults = async (surveyId: string) => {
        const jwt = (await Auth.currentSession()).getIdToken().getJwtToken();

        axios
            .post(
                appConfiguration.api_endpoint,
                {
                    operation: "results",
                    data: { surveyId: surveyId },
                },
                { headers: { Authorization: jwt } }
            )
            .then((data) => {
                setResults(data.data.data);
                setFilteredResults(data.data.data);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const exportResults = () => {
        const keys: string[] = [];
        const data: string[] = [];

        results.forEach((item) => {
            Object.keys(item).forEach((key) => {
                if (!keys.includes(key)) {
                    keys.push(key);
                }
            });
        });

        keys.sort();
        data.push(keys.join(","));

        results.forEach((item) => {
            let line: string[] = [];

            keys.forEach((key) => {
                if (item[key]) {
                    line.push(item[key]);
                } else {
                    line.push("");
                }
            });

            data.push(line.join(","));
        });

        const csvContent = new Blob([data.join("\n")]);

        const link = document.createElement("a");
        link.download = `${title}-results.csv`;
        link.href = URL.createObjectURL(csvContent);

        link.click();
    };

    const filterResults = (value: any) => {
        if (value !== null) {
            if (value.endDate === "") {
                value.endDate = value.startDate;
            }

            setDateRangeFilter(value);

            let startDate = new Date(value.startDate + " 00:00:00").getTime() / 1000;
            let endDate = value.endDate !== "" ? new Date(value.endDate + " 23:59:59").getTime() / 1000 : new Date(value.startDate + " 23:59:59").getTime() / 1000;
            
            let newFilteredResults = results.filter((o: any) => o.timestamp >= startDate && o.timestamp <= endDate);
            setFilteredResults(newFilteredResults);
        } else {
            setFilteredResults(results);
        }
        
    }

    return (
        <>
            <Tabs
                tabs={[
                    {
                        label: "Definition",
                        content: (
                            <form onSubmit={(event) => event.preventDefault()}>
                                <Form
                                    actions={
                                        <SpaceBetween direction="horizontal" size="xs">
                                            {!props.editable && (
                                                <Button onClick={() => setIsEditable(true)}>Edit</Button>
                                            )}
                                            {props.editable && (
                                                <>
                                                    <Button
                                                        formAction="none"
                                                        variant="link"
                                                        onClick={() => cancelEdits()}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        onClick={saveSurvey}
                                                        disabled={!validateForm()}
                                                    >
                                                        Save
                                                    </Button>
                                                </>
                                            )}
                                        </SpaceBetween>
                                    }
                                    errorText=""
                                >
                                    <SpaceBetween size="m">
                                        <Container
                                            header={
                                                <Header variant="h2" description="The name of the survey">
                                                    Survey Name
                                                </Header>
                                            }
                                        >
                                            <FormField stretch={true}>
                                                <Input
                                                    disabled={!props.editable || submitted}
                                                    type="text"
                                                    value={title}
                                                    onChange={(event) => setTitle(event.detail.value)}
                                                ></Input>
                                            </FormField>
                                        </Container>
                                        <Container
                                            header={
                                                <Header variant="h2" description="Messaging associated to the survey">
                                                    Messaging
                                                </Header>
                                            }
                                        >
                                            <SpaceBetween size="s">
                                                <FormField
                                                    stretch={true}
                                                    label="Introduction message (optional)"
                                                    description="The message to play at the start of the survey"
                                                >
                                                    <Input
                                                        disabled={!props.editable || submitted}
                                                        type="text"
                                                        value={intro}
                                                        onChange={(event) => setIntro(event.detail.value)}
                                                    ></Input>
                                                </FormField>
                                                <FormField
                                                    stretch={true}
                                                    label="Conclusion message (optional)"
                                                    description="The message to play at the end of the survey"
                                                >
                                                    <Input
                                                        disabled={!props.editable || submitted}
                                                        type="text"
                                                        value={outro}
                                                        onChange={(event) => setOutro(event.detail.value)}
                                                    ></Input>
                                                </FormField>
                                            </SpaceBetween>
                                        </Container>
                                        <Container
                                            header={
                                                <Header variant="h2" description="The range for valid input">
                                                    Input range
                                                </Header>
                                            }
                                        >
                                            <SpaceBetween direction="horizontal" size="s">
                                                <FormField stretch={false} label="From">
                                                    <Input
                                                        disabled={!props.editable || submitted}
                                                        type="number"
                                                        value={minimum.toString()}
                                                        invalid={!validateRange()}
                                                        onChange={(event) => setMinimum(parseInt(event.detail.value))}
                                                    ></Input>
                                                </FormField>
                                                <FormField stretch={false} label="To">
                                                    <Input
                                                        disabled={!props.editable || submitted}
                                                        type="number"
                                                        value={maximum.toString()}
                                                        invalid={!validateRange()}
                                                        onChange={(event) => setMaximum(parseInt(event.detail.value))}
                                                    ></Input>
                                                </FormField>
                                            </SpaceBetween>
                                        </Container>
                                        <Container
                                            header={
                                                <Header
                                                    variant="h2"
                                                    description="The content of the survey"
                                                    actions={
                                                        props.editable && (
                                                            <SpaceBetween direction="horizontal" size="xs">
                                                                <Button
                                                                    disabled={submitted}
                                                                    onClick={(event) => addQuestion()}
                                                                >
                                                                    Add question
                                                                </Button>
                                                            </SpaceBetween>
                                                        )
                                                    }
                                                >
                                                    Questions
                                                </Header>
                                            }
                                        >
                                            <SpaceBetween size="l">
                                                {questions.map((item, i) => (
                                                    <SpaceBetween size="xs" key={i}>
                                                        <FormField label={`Question ${i + 1}`} stretch={true}>
                                                            <Input
                                                                disabled={!props.editable || submitted}
                                                                type="text"
                                                                value={item.text}
                                                                onChange={(event) =>
                                                                    updateQuestion(
                                                                        i,
                                                                        event.detail.value,
                                                                        item.flag,
                                                                        item.threshold
                                                                    )
                                                                }
                                                            ></Input>
                                                        </FormField>
                                                        <ExpandableSection
                                                            variant="footer"
                                                            header="Additional settings"
                                                        >
                                                            <SpaceBetween size="s">
                                                                <Checkbox
                                                                    disabled={!props.editable || submitted}
                                                                    checked={item.flag}
                                                                    onChange={(event) =>
                                                                        updateQuestion(
                                                                            i,
                                                                            item.text,
                                                                            event.detail.checked,
                                                                            item.threshold
                                                                        )
                                                                    }
                                                                >
                                                                    Flag for review
                                                                </Checkbox>
                                                                <FormField label="Threshold">
                                                                    <Input
                                                                        type="number"
                                                                        value={
                                                                            item.threshold === -1
                                                                                ? ""
                                                                                : item.threshold.toString()
                                                                        }
                                                                        disabled={
                                                                            !item.flag || submitted || !props.editable
                                                                        }
                                                                        onChange={(event) =>
                                                                            updateQuestion(
                                                                                i,
                                                                                item.text,
                                                                                item.flag,
                                                                                parseInt(event.detail.value)
                                                                            )
                                                                        }
                                                                    ></Input>
                                                                </FormField>
                                                                <Button
                                                                    variant="link"
                                                                    onClick={(event) => removeQuestion(i)}
                                                                >
                                                                    Delete question
                                                                </Button>
                                                            </SpaceBetween>
                                                        </ExpandableSection>
                                                    </SpaceBetween>
                                                ))}
                                            </SpaceBetween>
                                        </Container>
                                    </SpaceBetween>
                                </Form>
                            </form>
                        ),
                        id: "definition",
                    },
                    {
                        label: "Results",
                        content: (
                            <>
                                <SpaceBetween size="m">
                                    <div className="flex-align-right" key="export-btn">
                                        <Button onClick={exportResults}>Export</Button>
                                    </div>
                                    <DateRangePicker
                                        key="daterange"
                                        onChange={({ detail }) => filterResults(detail.value)}
                                        value={dateRangeFilter}
                                        isValidRange={() => {
                                            return { valid: true };
                                        }}
                                        dateOnly
                                        rangeSelectorMode="absolute-only"
                                        relativeOptions={[
                                            {
                                                key: "previous-24-hours",
                                                amount: 1,
                                                unit: "minute",
                                                type: "relative",
                                            },
                                            {
                                                key: "previous-30-minutes",
                                                amount: 30,
                                                unit: "minute",
                                                type: "relative",
                                            },
                                            {
                                                key: "previous-1-hour",
                                                amount: 1,
                                                unit: "hour",
                                                type: "relative",
                                            },
                                            {
                                                key: "previous-6-hours",
                                                amount: 6,
                                                unit: "hour",
                                                type: "relative",
                                            },
                                        ]}
                                        i18nStrings={{
                                            todayAriaLabel: "Today",
                                            nextMonthAriaLabel: "Next month",
                                            previousMonthAriaLabel: "Previous month",
                                            customRelativeRangeDurationLabel: "Duration",
                                            customRelativeRangeDurationPlaceholder: "Enter duration",
                                            customRelativeRangeOptionLabel: "Custom range",
                                            customRelativeRangeOptionDescription: "Set a custom range in the past",
                                            customRelativeRangeUnitLabel: "Unit of time",
                                            formatRelativeRange: (e) => {
                                                const t = 1 === e.amount ? e.unit : `${e.unit}s`;
                                                return `Last ${e.amount} ${t}`;
                                            },
                                            formatUnit: (e, t) => (1 === t ? e : `${e}s`),
                                            dateTimeConstraintText: "",
                                            relativeModeTitle: "Relative range",
                                            absoluteModeTitle: "Absolute range",
                                            relativeRangeSelectionHeading: "Choose a range",
                                            startDateLabel: "Start date",
                                            endDateLabel: "End date",
                                            startTimeLabel: "Start time",
                                            endTimeLabel: "End time",
                                            clearButtonLabel: "Clear and dismiss",
                                            cancelButtonLabel: "Cancel",
                                            applyButtonLabel: "Apply",
                                        }}
                                        placeholder="Filter by a date range"
                                    />
                                    {questions.map((item, i) => (
                                        <Container
                                            key={i}
                                            header={
                                                <Header variant="h2" description={item.text}>
                                                    {" "}
                                                    {`Question ${i + 1}`}{" "}
                                                </Header>
                                            }
                                        >
                                            <PieChart
                                                key={i}
                                                hideFilter={true}
                                                data={getResults(i)}
                                                detailPopoverContent={(datum, sum) => [
                                                    { key: "Contact count", value: datum.value },
                                                    {
                                                        key: "Percentage",
                                                        value: `${((datum.value / sum) * 100).toFixed(0)}%`,
                                                    },
                                                ]}
                                                segmentDescription={(datum, sum) =>
                                                    `${datum.value} contacts, ${((datum.value / sum) * 100).toFixed(
                                                        0
                                                    )}%`
                                                }
                                                i18nStrings={{
                                                    detailsValue: "Value",
                                                    detailsPercentage: "Percentage",
                                                    filterLabel: "Filter displayed data",
                                                    filterPlaceholder: "Filter data",
                                                    filterSelectedAriaLabel: "selected",
                                                    detailPopoverDismissAriaLabel: "Dismiss",
                                                    legendAriaLabel: "Legend",
                                                    chartAriaRoleDescription: "pie chart",
                                                    segmentAriaRoleDescription: "segment",
                                                }}
                                                ariaDescription="Pie chart showing how many resources are currently in which state."
                                                ariaLabel="Pie chart"
                                                errorText="Error loading data."
                                                loadingText="Loading chart"
                                                recoveryText="Retry"
                                                empty={
                                                    <Box textAlign="center" color="inherit">
                                                        <b>No data available</b>
                                                        <Box variant="p" color="inherit">
                                                            There is no data available
                                                        </Box>
                                                    </Box>
                                                }
                                                noMatch={
                                                    <Box textAlign="center" color="inherit">
                                                        <b>No matching data</b>
                                                        <Box variant="p" color="inherit">
                                                            There is no matching data to display
                                                        </Box>
                                                        <Button>Clear filter</Button>
                                                    </Box>
                                                }
                                            />
                                        </Container>
                                    ))}
                                </SpaceBetween>
                            </>
                        ),
                        id: "results",
                    },
                ]}
            />
        </>
    );
};

export default Survey;
