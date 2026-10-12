// The home-screen widgets themselves. This file loads the widget package, so
// it is only ever loaded through ./index, where widgets are available.
import { getCalendars } from 'expo-localization';
import {
  type ColorProp,
  FlexWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
  type WidgetTaskHandlerProps,
  requestWidgetUpdate,
} from 'react-native-android-widget';
import type { MD3Theme } from 'react-native-paper';
import { sunPath } from '../lib/sun';
import { type ThemeChoice, resolveHour24 } from '../lib/time';
import { type Data, load } from '../storage';
import { darkTheme, lightTheme, tileColor, tileTextColor } from '../theme';
import { type WidgetState, logWakeFromWidget, widgetState } from './state';

// The names Android knows the widgets by. They match "widgets" in app.json.
const LOG = 'RiseLog';
const WEEK = 'RiseWeek';
const NAMES = [LOG, WEEK];
// What tapping the log button sends back to widgetTaskHandler.
const LOG_WAKE = 'LOG_WAKE';

// The font files are copied in by the widget plugin (see "fonts" in app.json).
const MEDIUM = 'Rubik_500Medium';
const REGULAR = 'Rubik_400Regular';
const SUN = 104;
const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${SUN}" height="${SUN}" viewBox="0 0 ${SUN} ${SUN}"><path d="${sunPath(SUN)}" fill="${tileColor(4)}"/></svg>`;

const colour = (value: string) => value as ColorProp;
const palette = (theme: MD3Theme) => ({
  card: colour(theme.colors.elevation.level1),
  text: colour(theme.colors.onSurface),
  secondary: colour(theme.colors.onSurfaceVariant),
  border: colour(theme.colors.outlineVariant),
});
const FRAME = {
  height: 'match_parent',
  width: 'match_parent',
  borderRadius: 28,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

type Props = { state: WidgetState; theme: MD3Theme };

// The small widget. Before today is logged it is the log button, and a tap
// logs without opening the app. Afterwards it shows the time, and a tap opens the app.
function LogWidget({ state, theme }: Props) {
  const colours = palette(theme);
  const { logged } = state;

  if (!logged) {
    const ink = colour(tileTextColor(4, theme));
    return (
      <FlexWidget
        style={{ ...FRAME, backgroundColor: colours.card }}
        clickAction={LOG_WAKE}
        accessibilityLabel="I'm up. Log your wake-up now."
      >
        <OverlapWidget style={{ width: SUN, height: SUN }}>
          <SvgWidget svg={SUN_SVG} style={{ width: SUN, height: SUN }} />
          <FlexWidget style={{ width: SUN, height: SUN, alignItems: 'center', justifyContent: 'center' }}>
            <TextWidget text="I'm up" style={{ fontSize: 17, fontFamily: MEDIUM, color: ink }} />
            <TextWidget text={`Target ${state.target}`} style={{ fontSize: 10, fontFamily: REGULAR, color: ink }} />
          </FlexWidget>
        </OverlapWidget>
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{ ...FRAME, backgroundColor: colours.card, flexGap: 4 }}
      clickAction="OPEN_APP"
      accessibilityLabel={`Up at ${logged.time}, ${logged.label}`}
    >
      <TextWidget text="Up at" style={{ fontSize: 13, fontFamily: REGULAR, color: colours.secondary }} />
      <TextWidget text={logged.time} style={{ fontSize: 28, fontFamily: MEDIUM, color: colours.text }} />
      <FlexWidget
        style={{
          backgroundColor: colour(tileColor(logged.level)),
          borderRadius: 999,
          paddingVertical: 4,
          paddingHorizontal: 12,
        }}
      >
        <TextWidget
          text={logged.label}
          style={{ fontSize: 12, fontFamily: MEDIUM, color: colour(tileTextColor(logged.level, theme)) }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

// The wide widget: the streak, and the last seven days as dots in the tile colours.
function WeekWidget({ state, theme }: Props) {
  const colours = palette(theme);
  const [value, caption] = state.streak;

  return (
    <FlexWidget
      style={{ ...FRAME, backgroundColor: colours.card, flexDirection: 'row', paddingHorizontal: 18, flexGap: 14 }}
      clickAction="OPEN_APP"
      accessibilityLabel={`Streak: ${value} ${caption}`}
    >
      <FlexWidget style={{ alignItems: 'flex-start' }}>
        <TextWidget text={value} style={{ fontSize: 30, fontFamily: MEDIUM, color: colours.text }} />
        <TextWidget
          text={caption}
          maxLines={2}
          style={{ fontSize: 12, fontFamily: REGULAR, color: colours.secondary }}
        />
      </FlexWidget>
      <FlexWidget style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {state.week.map((day, i) => (
          <FlexWidget key={i} style={{ alignItems: 'center', flexGap: 4 }}>
            <FlexWidget
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                ...(day.level === 0
                  ? { borderWidth: 1, borderColor: colours.border }
                  : { backgroundColor: colour(tileColor(day.level)) }),
              }}
            />
            <TextWidget text={day.letter} style={{ fontSize: 11, fontFamily: REGULAR, color: colours.secondary }} />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

// One widget, drawn for the theme chosen in Settings. With "Device", Android
// is given both and shows the one that matches the phone.
export function widgetView(name: string, state: WidgetState, theme: ThemeChoice) {
  const Widget = name === WEEK ? WeekWidget : LogWidget;
  const light = <Widget state={state} theme={lightTheme} />;
  const dark = <Widget state={state} theme={darkTheme} />;
  if (theme === 'device') return { light, dark };
  return theme === 'light' ? light : dark;
}

const deviceHour24 = () => getCalendars()[0]?.uses24hourClock ?? false;

// Redraws every widget on the home screen.
export async function drawAll(data: Data, hour24: boolean): Promise<void> {
  const state = widgetState(data, new Date(), hour24);
  await Promise.all(
    NAMES.map((widgetName) =>
      requestWidgetUpdate({
        widgetName,
        renderWidget: () => widgetView(widgetName, state, data.config.theme),
        widgetNotFound: () => {},
      }),
    ),
  );
}

// Android runs this when a widget is added, resized, due a refresh or tapped,
// whether or not the app is open.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (props.widgetAction === 'WIDGET_DELETED') return;
  let data: Data;
  try {
    data = await load();
  } catch {
    return; // nothing could be read, so the widget keeps what it shows
  }
  const tappedLog = props.widgetAction === 'WIDGET_CLICK' && props.clickAction === LOG_WAKE;
  if (tappedLog) data = await logWakeFromWidget(data, new Date());

  const hour24 = resolveHour24(data.config.timeFormat, deviceHour24());
  const state = widgetState(data, new Date(), hour24);
  props.renderWidget(widgetView(props.widgetInfo.widgetName, state, data.config.theme));
  // A log changes the streak widget too.
  if (tappedLog) await drawAll(data, hour24);
}
