import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/makeReduxStore';
import BackendPage from '../../Layouts/BackendPage';
import Card from '../../Components/Form/Card';
import UserProfileEditor from '../../Components/User/UserProfileEditor';

const MyProfilePage = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <BackendPage checkPackage={false} selectedMenu={''}>
      <Card>
        {(user === null || user === undefined) ? '' : (
          <UserProfileEditor user={user}/>
        )}
      </Card>
    </BackendPage>
  );
};

export default MyProfilePage;
