import '../styles/classifieds.css';
import { modalStyles } from '../styles/ModalStyles';
import Modal from 'react-modal';
import { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import { gql, useQuery, useMutation, useLazyQuery} from '@apollo/client';

export default function Classifieds() {
  const GET_USERS_QUERY = gql`
    query AllUsers {
      allUsers {
        id
        phoneNumber
      }
    }
  `;
  const CREATE_USER_MUTATION = gql`
    mutation CreateUser($phoneNumber: String!, $title: String!, $content: String!) {
      createUser(phoneNumber: $phoneNumber, title: $title, content: $content) {
        id
      }
    }
  `;
  const CREATE_CLASSIFIED_MUTATION = gql`
    mutation CreateClassified($title: String!, $content: String!) {
      createClassified(title: $title, content: $content) {
        id
      }
    }
  `;
  const GET_CLASSIFIEDS_QUERY = gql`
    query AllClassifieds {
      allClassifieds {
        id
        title
        content
        User {
          id
          phoneNumber
        }
      }
    }
  `;
  const FIND_CLASSIFIEDS_QUERY = gql`
    query FindClassifieds($searchString: String!) {
      findClassifieds(searchString: $searchString) {
        id
        title
        content
        User {
          id
          phoneNumber
        }
      }
    }
  `;
  const {data: usersData} = useQuery(GET_USERS_QUERY);
  const [createUserMutate] = useMutation(CREATE_USER_MUTATION, {
    refetchQueries: [{query: GET_USERS_QUERY}, {query: GET_CLASSIFIEDS_QUERY}, {query: FIND_CLASSIFIEDS_QUERY}]
  });
  const [createClassifiedMutate] = useMutation(CREATE_CLASSIFIED_MUTATION, {
    refetchQueries: [{query: GET_USERS_QUERY}, {query: GET_CLASSIFIEDS_QUERY}, {query: FIND_CLASSIFIEDS_QUERY}]
  });
  const {data: classifiedsData} = useQuery(GET_CLASSIFIEDS_QUERY);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [recentClassifiedsTreshold, setRecentClassifiedsTreshold] = useState(4);
  const [showLoadMoreRecentClassifiedsButton, setShowLoadMoreRecentClassifiedsButton] = useState(false);
  const [findClassifiedsQueryFunction] = useLazyQuery(FIND_CLASSIFIEDS_QUERY);
  const [foundClassifiedsData, setFoundClassifiedsData] = useState<any>(null);
  const [searchPhrase, setSearchPhrase] = useState(null);
  const [foundClassifiedsTreshold, setFoundClassifiedsTreshold] = useState(4);
  const [showFoundClassifiedsLoadMoreButton, setShowFoundClassifiedsLoadMoreButton] = useState(false);
  const addClassifiedFormikReference = useRef<any>(null);
  const searchParams = new URLSearchParams(window.location.search);
  const accessToken = searchParams.get('access_token');
  useEffect(() => {
    if(classifiedsData?.allClassifieds && recentClassifiedsTreshold < classifiedsData?.allClassifieds?.length - 1) {
      setShowLoadMoreRecentClassifiedsButton(true);
    }
    if(foundClassifiedsData && foundClassifiedsTreshold < foundClassifiedsData?.length - 1) {
      setShowFoundClassifiedsLoadMoreButton(true);
    }
  });
  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    document.body.style.overflow = 'auto';
    setIsOpen(false);
  };
  const classifiedInitialValues = {
    classifiedTitle: '',
    classifiedPhoneNumber: '',
    classifiedContent: '',
    isPhoneNumberVerified: '',
  };
  const classifiedPhoneNumberValidationRegex = /^\+\d+\s\d+$/;
  const classifiedValidationSchema = yup.object({
    classifiedTitle: yup.string().max(30, '30 characters or less').required("Title is required"),
    classifiedPhoneNumber: yup.string().max(50,'50 characters or less').required("Phone number is required")
      .matches(classifiedPhoneNumberValidationRegex,'Wrong format (example: +48 123456789)'),
    classifiedContent: yup.string().max(1300, '1300 characters or less').required("Content is required")
      .test('checkTextAreaNumberOfLineBreaks','Too many line breaks',
        function(value) {
          const maxLineBreaks = 10;
          if(value.split('\n').length > maxLineBreaks) return false;
          return true;
        }
      ),
    isPhoneNumberVerified: yup.string().test('checkIfPhoneNumberIsVerified','Phone number is not verified',
      function() {
        if(accessToken) return true;
          return false;
      }
    ),
  });
  async function addClassified(values: any, {setSubmitting}: any) {
      setSubmitting(true);
      let phoneNumberExists = false;
      usersData?.allUsers?.forEach(
        function(user: any) {
          if(user?.phoneNumber === values.classifiedPhoneNumber) {
            phoneNumberExists = true;
          }
        }
      );
      if(phoneNumberExists) {
        const parameters = {
          title: values.classifiedTitle,
          content: values.classifiedContent,
        };
        await createClassifiedMutate({variables: parameters});
      }
      else {
        const parameters = {
          phoneNumber: values.classifiedPhoneNumber,
          title: values.classifiedTitle,
          content: values.classifiedContent,
        };
        await createUserMutate({variables: parameters});
      }
      closeModal();
      setSubmitting(false);
  }
  window.onscroll = function() {
    const goToTopOfPageButton = document.getElementById("classifieds-classifieds-go-to-top-of-page-button");
    const distanceFromTopOfPage = 500;
    if(document.body.scrollTop > distanceFromTopOfPage || document.documentElement.scrollTop > distanceFromTopOfPage) {
      if(goToTopOfPageButton) goToTopOfPageButton.style.display = "block";
    }
    else {
      if(goToTopOfPageButton) goToTopOfPageButton.style.display = "none";
    }
  };
  function goToTopOfPage() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
  function loadMoreRecentClassifieds() {
    const step = 5;
    setRecentClassifiedsTreshold(recentClassifiedsTreshold + step);
    if(recentClassifiedsTreshold + step >= classifiedsData?.allClassifieds?.length - 1) {
      setShowLoadMoreRecentClassifiedsButton(false);
    }
  }
  const findClassifiedsAcceptableKeys = [
    'A','B','C','D','E','F','G','H','I','J','K',
    'L','M','N','O','P','Q','R','S','T','U','V',
    'W','X','Y','Z','a','b','c','d','e','f','g',
    'h','i','j','k','l','m','n','o','p','q','r',
    's','t','u','v','w','x','y','z','0','1','2',
    '3','4','5','6','7','8','9',':',';',',','.',
    '?','!','/',' ','Enter','Backspace'];
  async function findClassifieds(e: any) {
    setFoundClassifiedsTreshold(4);
    if(e?.target?.value?.length === 0) {
      setFoundClassifiedsData(null);
      setSearchPhrase(null);
    }
    const searchPhraseCharacters: any[] = e?.target?.value?.split('')?.map((value: any) => { 
      if(findClassifiedsAcceptableKeys?.includes(value)) {
        return true;
      }
      return false;
    });
    const allSearchPhraseCharactersAcceptable: boolean = searchPhraseCharacters?.every((elem) => {
      if(elem) {
        return true;
      }
      return false;
    });
    if(findClassifiedsAcceptableKeys?.includes(e?.key) && allSearchPhraseCharactersAcceptable && e?.target?.value?.length > 0) {
      try {
        const foundClassifieds = await findClassifiedsQueryFunction({variables: {searchString: e?.target?.value}});
        setFoundClassifiedsData(foundClassifieds?.data?.findClassifieds);
        setSearchPhrase(e?.target?.value);
      }
      catch(e) {
        console.log(e);
      }
    }
  }
  function loadMoreFoundClassifieds() {
    const step = 5;
    setFoundClassifiedsTreshold(foundClassifiedsTreshold + step);
    if(foundClassifiedsTreshold + step >= foundClassifiedsData?.length - 1) {
      setShowFoundClassifiedsLoadMoreButton(false);
    }
  }
  async function verifyPhoneNumber() {
    window.open('https://www.phone.email/auth/log-in?client_id=14261789965560618681&redirect_url=http://localhost:3000/', 'peLoginWindow', 'toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0, width=500, height=560, top=' + (window.screen.height - 600) / 2 + ', left=' + (window.screen.width - 500) / 2);
  }
  return (
    <div className='classifieds-container'>
      <div className='classifieds-navbar'>
        <div className='classifieds-navbar-left'></div>
        <div className='classifieds-navbar-middle'>
          <form className='classifieds-classifieds-search-form' onSubmit={(e:any) => e.preventDefault()}>
            <input id='classifieds-classifieds-search-form-input' type='text' placeholder='Search...' onKeyUp={findClassifieds}></input>
          </form>
        </div>
        <div className='classifieds-navbar-right'>
          <button id='classifieds-add-classified-button' onClick={openModal}>Add Classified</button>
          <button id='classifieds-verify-phone-number-button' type='button' onClick={verifyPhoneNumber}>Verify phone number</button>
          <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={modalStyles} ariaHideApp={false}>
            <h1 className='classifieds-add-classified-modal-h1'>Add Classified</h1>
            <Formik initialValues={classifiedInitialValues} validationSchema={classifiedValidationSchema} onSubmit={addClassified} innerRef={addClassifiedFormikReference}>
              <Form className='classifieds-add-classified-modal-formik-form'>
                <Field name='classifiedTitle' className='classifieds-add-classified-modal-formik-form-field' type='text' placeholder='title'></Field>
                <ErrorMessage name='classifiedTitle' className='classifieds-add-classified-modal-formik-form-field-error-message' component={'div'} />
                <Field name='classifiedPhoneNumber' className='classifieds-add-classified-modal-formik-form-field' type='text' placeholder='phone number'></Field>
                <ErrorMessage name='classifiedPhoneNumber' className='classifieds-add-classified-modal-formik-form-field-error-message' component={'div'} />
                <Field name='classifiedContent' className='classifieds-add-classified-modal-formik-form-field-text-area' type='text' as='textarea'></Field>
                <ErrorMessage name='classifiedContent' className='classifieds-add-classified-modal-formik-form-field-error-message' component={'div'} />
                <button id='classifieds-add-classified-modal-formik-form-button' type='submit'>Add</button>
                <Field name='isPhoneNumberVerified' hidden></Field>
                <ErrorMessage name='isPhoneNumberVerified' className='classifieds-add-classified-modal-formik-form-field-is-phone-number-verified-error-message' component={'div'} />
              </Form>
            </Formik>
          </Modal>
        </div>
      </div>
      <button id='classifieds-classifieds-go-to-top-of-page-button' onClick={goToTopOfPage}>Go to top</button>
      <div className='classifieds-classifieds'>
        {
          foundClassifiedsData ? (
            <>
              <h1 className='classifieds-classifieds-h1'>Results For "{searchPhrase}"</h1>
              {
                foundClassifiedsData?.filter((classified: any, index: any) => index <= foundClassifiedsTreshold)?.map((classified: any, index: any) => (
                  <div className='classifieds-classifieds-classified' key={index}>
                    <h2 className='classifieds-classifieds-classified-h2'>{classified?.title}</h2>
                    <h3 className='classifieds-classifieds-classified-h3'>{classified?.User?.phoneNumber}</h3>
                    <div className='classifieds-classifieds-classified-content'>{classified?.content}</div>
                  </div>
                ))
              }
              {
                showFoundClassifiedsLoadMoreButton ? (
                  <div className='classifieds-classifieds-load-more'>
                    <button id='classifieds-classifieds-load-more-button' onClick={loadMoreFoundClassifieds}>Load more</button>
                  </div>
                ) : null
              }
            </>
          ) : (
            <>
              <h1 className='classifieds-classifieds-h1'>Recent Classifieds</h1>
              {
                classifiedsData ? (
                  classifiedsData?.allClassifieds?.filter((classified: any, index: any) => index <= recentClassifiedsTreshold)?.map((classified: any, index: any) => (
                    <div className='classifieds-classifieds-classified' key={index}>
                      <h2 className='classifieds-classifieds-classified-h2'>{classified?.title}</h2>
                      <h3 className='classifieds-classifieds-classified-h3'>{classified?.User?.phoneNumber}</h3>
                      <div className='classifieds-classifieds-classified-content'>{classified?.content}</div>
                    </div>
                  ))
                ) : null
              }
              {
                showLoadMoreRecentClassifiedsButton ? (
                  <div className='classifieds-classifieds-load-more'>
                    <button id='classifieds-classifieds-load-more-button' onClick={loadMoreRecentClassifieds}>Load more</button>
                  </div>
                ) : null
              }
            </>
          )
        }
      </div>
    </div>
  )
}