import APIProvider from 'api/APIProvider'
import { BaseProvider } from 'baseui'
import PageSpinner from 'components/pageSpinner'
import PrivateComponent from 'components/privateComponent'
import ConfiguredRoutes, { type AppCodeSplit as AppCodeSplitType, Pages } from 'constants/routes'
import SourceProviderConnectionType from 'constants/sourceProviderConnectionType'
import { WorkspaceContextProvider } from 'context/workspaceContext'
import { getCurrentAppSection } from 'helpers/constantsHelpers'
import nameFunction from 'helpers/nameFunction'
import { isSubdomainApp } from 'hooks/useUniqueSubdomainFeatures'
import { AppPageLocation } from 'pages/streamlitApp/legacy/streamlitAppPage'
import LocalStorageProvider from 'providers/LocalStorageProvider'
import SessionStorageProvider, { RedirectFromSessionStorage } from 'providers/SessionStorageProvider'
import StateProvider from 'providers/StateProvider'
import ErrorBoundary from 'providers/ErrorBoundary/ErrorBoundary'
import type React from 'react'
import { lazy, memo, type ReactElement, Suspense } from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Provider as ReduxProvider } from 'react-redux'
import { createBrowserRouter, Navigate, Outlet, type RouteObject, RouterProvider } from 'react-router-dom'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { S4TLightTheme } from 'theme/s4t-light-theme'
import store from './redux-store'
import './tailwind.css'
import AnalyticsClientProvider from './providers/AnalyticsClientProvider'
import { useDatadogManualViewTracking } from './telemetry/datadog'
import { RouteBoundary } from 'providers/ErrorBoundary/RouteBoundary'

const StreamlitSubdomainAppPage = lazy(
  nameFunction(
    'StreamlitSubdomainAppPage',
    async () => await import('pages/streamlitApp/subdomain')
  )
)

type PrivateRouteResult = RouteObject & {
  lazy?: () => Promise<{ Component: () => ReactElement }>
  element?: ReactElement
}
// wrap element and Component on <PrivateComponent />
function privateRoute (route: RouteObject, sourceProvider?: SourceProviderConnectionType): RouteObject & PrivateRouteResult {
  const { lazy: origLazy, element: origElement } = route
  const lazy = origLazy == null
    ? undefined
    : async () => {
      const loaded = await origLazy()
      const LazyComponent = loaded.Component
      const Component = (): ReactElement => (
        <PrivateComponent
          gitHubUserOnly={
            sourceProvider ===
            SourceProviderConnectionType.SP_GITHUB_ACCOUNT
          }
        >
          {LazyComponent != null ? <LazyComponent /> : <></>}
        </PrivateComponent>)

      return { ...route.lazy, Component }
    }

  const element = origElement == null
    ? undefined
    : (<PrivateComponent
      gitHubUserOnly={
        sourceProvider ===
        SourceProviderConnectionType.SP_GITHUB_ACCOUNT
      }
    >
      {route.element as ReactElement}
    </PrivateComponent>)
  return { ...route, lazy, element }
}

export const appCodeSplit: AppCodeSplitType = {
  [Pages.APP]: [
    {
      path: ConfiguredRoutes.ROOT_WITH_OPTIONALS,
      element: <StreamlitSubdomainAppPage
        appPageLocation={AppPageLocation.SubdomainAppViewer}
      />
    }
  ],
  [Pages.DASHBOARD]: [
    {
      path: ConfiguredRoutes.REDIRECT,
      element: <RedirectFromSessionStorage />
    },
    {
      path: ConfiguredRoutes.LOGIN,
      lazy: async () => await import('pages/login')
    },
    privateRoute(
      {
        path: ConfiguredRoutes.DASHBOARD,
        lazy: async () => await import('pages/onboardingFlow')
      }),
    privateRoute(
      {
        path: ConfiguredRoutes.SIGNUP,
        lazy: async () => await import('pages/onboardingFlow')
      }),
    privateRoute(
      {
        path: ConfiguredRoutes.NEW_APP,
        lazy: async () => await import('pages/newAppWizard')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.TEMPLATE_PREVIEW_ID,
        lazy: async () => await import('pages/newAppWizard/components/templatePreview')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.NEW_APP_DEPLOY_FROM_TEMPLATE,
        lazy: async () => await import('pages/newAppWizard/components')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.NEW_APP_DEPLOY_FROM_TEMPLATE_APPID,
        lazy: async () => await import('pages/newAppWizard/components')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.DEPLOY,
        lazy: async () => await import('pages/deploy')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.DEPLOY_SAMPLE_APP,
        lazy: async () => await import('pages/sampleApp')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.FORK_SAMPLE_APP,
        lazy: async () => await import('pages/sampleApp/fork')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.CREATE_FROM_FORK,
        lazy: async () => await import('pages/CreateFromFork')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    privateRoute(
      {
        path: ConfiguredRoutes.CREATE_TEMPLATE_FROM_APPID,
        lazy: async () => await import('pages/createFromTemplate')
      },
      SourceProviderConnectionType.SP_GITHUB_ACCOUNT),
    {
      path: ConfiguredRoutes.ERROR,
      // lazy complain if the component takes props
      lazy: () => import('pages/error') as any
    },
    {
      path: ConfiguredRoutes.UPDATED_EMAIL,
      lazy: async () => await import('pages/updatedEmail')
    },
    {
      path: ConfiguredRoutes.LOGIN_REQUIRED,
      lazy: async () => await import('pages/loginRequired')
    },
    {
      path: ConfiguredRoutes.ERROR_NOT_FOUND_OR_NOT_AUTHORIZED,
      lazy: async () => await import('pages/notFound')
    },
    {
      path: ConfiguredRoutes.ERROR_NEW_LOGIN,
      lazy: async () => await import('pages/newLoginErrorPage')
    },
    {
      path: ConfiguredRoutes.APP_PLACEHOLDER_WITH_OPTIONALS,
      lazy: async () => {
        const { Component } = await import('pages/streamlitApp/legacy')
        return { Component: () => <Component appPageLocation={AppPageLocation.ConsolePlaceholder} /> }
      }
    },
    {
      path: ConfiguredRoutes.APP_WITH_OPTIONALS,
      lazy: async () => await import('pages/streamlitApp/legacy')
    },
    {
      path: ConfiguredRoutes.DATASETS,
      lazy: async () => await import('pages/datasets/Datasets')
    },
    {
      path: ConfiguredRoutes.DATASET_DETAILS,
      lazy: async () => await import('pages/datasetDetails/DatasetDetails')
    },
    {
      path: '*', // catch all 404
      lazy: async () => await import('pages/notFound')
    },
    {
      path: ConfiguredRoutes.EXPLORE,
      lazy: async () => await import('pages/gallery/AppGallery')
    },
    {
      path: ConfiguredRoutes.GALLERY,
      element: <Navigate to={ConfiguredRoutes.EXPLORE} replace />
    },
    {
      path: ConfiguredRoutes.PROFILE_PAGE,
      lazy: async () => await import('pages/profilePage/ProfilePage')
    },
    {
      path: ConfiguredRoutes.NEW_APP_CHOOSE_TEMPLATE,
      element: <Navigate to={ConfiguredRoutes.NEW_APP_DEPLOY_FROM_TEMPLATE} replace />
    },
    {
      path: ConfiguredRoutes.CREATE_FROM_TEMPLATE,
      element: <Navigate to={ConfiguredRoutes.NEW_APP_DEPLOY_FROM_TEMPLATE} replace />
    }
  ].map(entry => entry.lazy ? { ...entry, ErrorBoundary: RouteBoundary } : entry)
}

function MaybeWrapInSessionAndLocalStorageProviders ({ wrap, children }: { wrap: boolean, children: React.ReactNode }): ReactElement {
  return !wrap
    ? <>{children}</>
    : <SessionStorageProvider>
      <LocalStorageProvider>
        {children}
      </LocalStorageProvider>
    </SessionStorageProvider>
}

function ContextProvidersAndSetup (): ReactElement {
  useDatadogManualViewTracking()
  const isAppViewerPageOnSubdomain = isSubdomainApp()

  return (
    <HelmetProvider>
      <Helmet defaultTitle="Streamlit" titleTemplate="%s · Streamlit" />
      <StateProvider>
        <WorkspaceContextProvider>
          <MaybeWrapInSessionAndLocalStorageProviders wrap={!isAppViewerPageOnSubdomain}>
            <AnalyticsClientProvider>
              <Outlet />
            </AnalyticsClientProvider>
          </MaybeWrapInSessionAndLocalStorageProviders>
        </WorkspaceContextProvider>
      </StateProvider>
    </HelmetProvider>)
}

function withContextProvidersAndSetup (routes: RouteObject[]): RouteObject[] {
  return [{ Component: ContextProvidersAndSetup, children: routes }]
}

function App (): ReactElement {
  const appSection = getCurrentAppSection()
  const engine = new Styletron({ prefix: 'st-' })

  return (
    <ReduxProvider store={store}>
      <APIProvider>
        <StyletronProvider value={engine}>
          <BaseProvider theme={S4TLightTheme}>
            <ErrorBoundary>
              <Suspense fallback={<PageSpinner overlay />}>
                <RouterProvider router={createBrowserRouter(withContextProvidersAndSetup(appCodeSplit[appSection]))} fallbackElement={<PageSpinner overlay />} />
              </Suspense>
            </ErrorBoundary>
          </BaseProvider>
        </StyletronProvider>
      </APIProvider>
    </ReduxProvider >
  )
}

export default memo(App)
