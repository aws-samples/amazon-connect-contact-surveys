import {Auth} from '@aws-amplify/auth';
import React, { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css';

interface LogoutProps {}

const Logout: FC<LogoutProps> = () => {
    const nav = useNavigate();

    useEffect(() => {
        Auth.signOut().then(data => {
            nav("/");
        })
        .catch(err => {
            console.log(err);
        });
    }, []);

    return (<></>);
}

export default Logout;
