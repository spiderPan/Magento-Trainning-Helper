function ActivityRepository() {
    this.ActivityList = new Array();
    this.ActivityTree = null;
    this.SortedActivityList = new Array();
    this.ActivityListByIdentifier = new Array();
}
ActivityRepository.prototype.InitializeFromRegistration = ActivityRepository_InitializeFromRegistration;
ActivityRepository.prototype.BuildActivity = ActivityRepository_BuildActivity;
ActivityRepository.prototype.GetActivityByDatabaseId = ActivityRepository_GetActivityByDatabaseId;
ActivityRepository.prototype.PreOrderTraversal = ActivityRepository_PreOrderTraversal;
ActivityRepository.prototype.GetSortedIndexOfActivity = ActivityRepository_GetSortedIndexOfActivity;
ActivityRepository.prototype.Clone = ActivityRepository_Clone;
ActivityRepository.prototype.TearDown = ActivityRepository_TearDown;
ActivityRepository.prototype.SetSequencer = ActivityRepository_SetSequencer;
ActivityRepository.prototype.GetActivityPath = ActivityRepository_GetActivityPath;
ActivityRepository.prototype.GetRootActivity = ActivityRepository_GetRootActivity;
ActivityRepository.prototype.DoesActivityExist = ActivityRepository_DoesActivityExist;
ActivityRepository.prototype.GetActivityFromIdentifier = ActivityRepository_GetActivityFromIdentifier;
ActivityRepository.prototype.GetParentActivity = ActivityRepository_GetParentActivity;
ActivityRepository.prototype.GetNumDeliverableActivities = ActivityRepository_GetNumDeliverableActivities;

function ActivityRepository_InitializeFromRegistration(_1, _2) {
    this.ActivityList = _1.Activities;
    this.ActivityTree = this.BuildActivity(_1, _1.Package.LearningObjects[0], null, 1);
    this.PreOrderTraversal(this.ActivityTree, this.SortedActivityList);
    var _3 = _2[-1];
    var _4 = "";
    for (var i = 0; i < this.ActivityList.length; i++) {
        _4 = "";
        var _6 = _2[this.ActivityList[i].DatabaseId];
        if (_6 !== null && _6 !== undefined) {
            _4 = _6;
        } else {
            if (_3 !== null && _3 !== undefined) {
                _4 = _3;
            }
        }
        if (_4 !== "") {
            this.ActivityList[i].LearningObject.Parameters = MergeQueryStringParameters(_4, this.ActivityList[i].LearningObject.Parameters);
        }
        this.ActivityListByIdentifier[this.ActivityList[i].GetItemIdentifier()] = this.ActivityList[i];
    }
}

function ActivityRepository_BuildActivity(_7, _8, _9, _a) {
    var _b = _7.FindActivityForThisScormObject(_8.DatabaseIdentifier);
    _b.LearningObject = _8;
    _b.ParentActivity = _9;
    if (_b.Ordinal == 0) {
        _b.Ordinal = _a;
    }
    var _c;
    for (var _d in _b.ActivityObjectives) {
        _c = null;
        for (var _e in _8.SequencingData.Objectives) {
            if (_8.SequencingData.Objectives[_e].Id == _b.ActivityObjectives[_d].Identifier) {
                _c = _8.SequencingData.Objectives[_e];
                break;
            }
        }
        if (_c === null) {
            if (_8.SequencingData.PrimaryObjective !== null && _8.SequencingData.PrimaryObjective.Id == _b.ActivityObjectives[_d].Identifier) {
                _c = _8.SequencingData.PrimaryObjective;
            }
        }
        if (_c !== null) {
            _b.ActivityObjectives[_d].SatisfiedByMeasure = _c.SatisfiedByMeasure;
            _b.ActivityObjectives[_d].MinNormalizedMeasure = _c.MinNormalizedMeasure;
            _b.ActivityObjectives[_d].Maps = _c.Maps;
        }
        identifier = _b.ActivityObjectives[_d].GetIdentifier();
        if (_b.RunTime !== null && identifier !== null && identifier !== undefined && identifier.length > 0) {
            runTimeObjective = _b.RunTime.FindObjectiveWithId(identifier);
            if (runTimeObjective === null) {
                _b.RunTime.AddObjective();
                runTimeObjective = _b.RunTime.Objectives[_b.RunTime.Objectives.length - 1];
                runTimeObjective.Identifier = identifier;
            }
        }
    }
    for (var i = 0; i < _8.Children.length; i++) {
        _b.ChildActivities[i] = this.BuildActivity(_7, _8.Children[i], _b, (i + 1));
    }
    _b.StringIdentifier = _b.toString();
    return _b;
}

function ActivityRepository_GetActivityByDatabaseId(_10) {
    if (_10 === null) {
        return null;
    } else {
        for (var i = 0; i < this.ActivityList.length; i++) {
            if (this.ActivityList[i].DatabaseId == _10) {
                return this.ActivityList[i];
            }
        }
    }
    Debug.AssertError("Searched for an activity by database id that did not exist.");
    return null;
}

function ActivityRepository_PreOrderTraversal(_12, _13) {
    _13[_13.length] = _12;
    for (var i = 0; i < _12.ChildActivities.length; i++) {
        this.PreOrderTraversal(_12.ChildActivities[i], _13);
    }
}

function ActivityRepository_GetSortedIndexOfActivity(_15) {
    for (var i = 0; i < this.SortedActivityList.length; i++) {
        if (this.SortedActivityList[i] == _15) {
            return i;
        }
    }
    Debug.AssertError("Activity not found in sorted list of activities");
    return null;
}

function ActivityRepository_Clone() {
    var _17 = new ActivityRepository();
    var _18;
    var _19;
    var _1a;
    for (_1a = 0; _1a < this.ActivityList.length; _1a++) {
        _18 = this.ActivityList[_1a].Clone();
        _17.ActivityList[_1a] = _18;
        _17.ActivityListByIdentifier[_18.GetItemIdentifier()] = _18;
        if (this.ActivityList[_1a].ParentActivity === null) {
            _17.ActivityTree = _17.ActivityList[_1a];
        }
    }
    for (_1a = 0; _1a < this.ActivityList.length; _1a++) {
        _19 = this.ActivityList[_1a];
        _18 = _17.ActivityList[_1a];
        if (_19.ParentActivity === null) {
            _18.ParentActivity = null;
        } else {
            _18.ParentActivity = _17.GetActivityFromIdentifier(_19.ParentActivity.GetItemIdentifier());
        }
        for (var _1b in _19.ChildActivities) {
            _18.ChildActivities[_1b] = _17.GetActivityFromIdentifier(_19.ChildActivities[_1b].GetItemIdentifier());
        }
        _18.AvailableChildren = new Array();
        for (var _1c in _19.AvailableChildren) {
            _18.AvailableChildren[_1c] = _17.GetActivityFromIdentifier(_19.AvailableChildren[_1c].GetItemIdentifier());
        }
    }
    _17.PreOrderTraversal(_17.ActivityTree, _17.SortedActivityList);
    return _17;
}

function ActivityRepository_TearDown() {
    for (var _1d in this.ActivityList) {
        this.ActivityList[_1d].TearDown();
        this.ActivityList[_1d] = null;
    }
    this.ActivityList = null;
    this.ActivityTree = null;
    this.SortedActivityList = null;
}

function ActivityRepository_SetSequencer(_1e, _1f) {
    for (var _20 in this.ActivityList) {
        this.ActivityList[_20].SetSequencer(_1e, _1f);
    }
}

function ActivityRepository_GetActivityPath(_21, _22) {
    var _23 = new Array();
    var _24 = 0;
    if (_22) {
        _23[_24] = _21;
        _24++;
    }
    while (_21.ParentActivity !== null) {
        _21 = _21.ParentActivity;
        _23[_24] = _21;
        _24++;
    }
    return _23;
}

function ActivityRepository_GetRootActivity() {
    var _25 = null;
    for (var i = 0; i < this.SortedActivityList.length; i++) {
        if (this.SortedActivityList[i].ParentActivity === null) {
            _25 = this.SortedActivityList[i];
            break;
        }
    }
    return _25;
}

function ActivityRepository_DoesActivityExist(_27) {
    if (this.ActivityListByIdentifier[_27] !== null && this.ActivityListByIdentifier[_27] !== undefined) {
        return true;
    }
    return false;
}

function ActivityRepository_GetActivityFromIdentifier(_28) {
    if (this.ActivityListByIdentifier[_28] !== null && this.ActivityListByIdentifier[_28] !== undefined) {
        return this.ActivityListByIdentifier[_28];
    }
    return null;
}

function ActivityRepository_GetParentActivity(_29) {
    var _2a = null;
    if (_29 !== null) {
        _2a = _29.ParentActivity;
    }
    return _2a;
}

function ActivityRepository_GetNumDeliverableActivities() {
    var _2b = 0;
    for (var i = 0; i < this.ActivityList.length; i++) {
        if (this.ActivityList[i].IsDeliverable()) {
            _2b++;
        }
    }
    return _2b;
}
var CommandSentry;
(function() {
    "use strict";
    var tX1 = 0,
        tX2 = 0,
        tY1 = 0,
        tY2 = 0,
        _31 = false,
        _32 = false;
    CommandSentry = function() {
        this._keySequences = [];
        this._touchSequences = [];
        this._successCallbacks = [];
        this._keySeqCounters = [];
        this._touchSeqCounters = [];
    };
    CommandSentry.prototype = {
        addCommand: function(_33, _34, _35) {
            this._keySequences.push(_34);
            this._keySeqCounters.push(0);
            this._touchSequences.push(_35);
            this._touchSeqCounters.push(0);
            this._successCallbacks.push(_33);
        },
        addTargetElement: function(_36) {
            if (typeof _36 === "undefined") {
                _36 = document;
            }
            var i;
            for (i = 0; i < this._keySequences.length; i++) {
                if (this._keySequences[i].length > 0) {
                    this._addEvent(_36, "keypress", this._keypressCallback);
                    break;
                }
            }
            for (i = 0; i < this._touchSequences.length; i++) {
                if (this._touchSequences[i].length > 0) {
                    this._addEvent(_36, "touchstart", this._touchstartCallback);
                    this._addEvent(_36, "touchmove", this._touchmoveCallback);
                    this._addEvent(_36, "touchend", this._touchendCallback);
                    break;
                }
            }
        },
        enterKeyCode: function(_38) {
            var i;
            for (i = 0; i < this._keySequences.length; i++) {
                if (_38 !== this._keySequences[i][this._keySeqCounters[i]]) {
                    this._keySeqCounters[i] = 0;
                }
                if (_38 === this._keySequences[i][this._keySeqCounters[i]]) {
                    this._keySeqCounters[i]++;
                    if (this._keySeqCounters[i] === this._keySequences[i].length && this._keySeqCounters[i] > 0) {
                        this._keySeqCounters[i] = 0;
                        this._successCallbacks[i]();
                    }
                }
            }
        },
        _addEvent: function(_3a, _3b, _3c) {
            if (_3a.addEventListener) {
                _3a.addEventListener(_3b, CommandSentry.bind(this, _3c), false);
            } else {
                if (_3a.attachEvent) {
                    _3a.attachEvent("on" + _3b, CommandSentry.bind(this, _3c, _3a.parentWindow.event));
                }
            }
        },
        _evaluateTouchCommand: function() {
            var dx = tX2 - tX1;
            var dy = tY2 - tY1;
            var _3f = (dx > 0) ? "r" : "l";
            var _40 = (dy > 0) ? "d" : "u";
            var _41 = (Math.abs(dx) > Math.abs(dy)) ? _3f : _40;
            _41 = (_31) ? "t" : _41;
            var i;
            for (i = 0; i < this._touchSequences.length; i++) {
                if (_41 !== this._touchSequences[i][this._touchSeqCounters[i]]) {
                    this._touchSeqCounters[i] = 0;
                }
                if (_41 === this._touchSequences[i][this._touchSeqCounters[i]]) {
                    this._touchSeqCounters[i]++;
                    if (this._touchSeqCounters[i] === this._touchSequences[i].length && this._touchSeqCounters[i] > 0) {
                        this._touchSeqCounters[i] = 0;
                        this._successCallbacks[i]();
                    }
                }
            }
        },
        _keypressCallback: function(_43) {
            var _44 = (_43.keyCode !== 0) ? _43.keyCode : _43.charCode;
            this.enterKeyCode(_44);
        },
        _touchstartCallback: function(_45) {
            tX1 = _45.changedTouches[0].pageX;
            tY1 = _45.changedTouches[0].pageY;
            _31 = true;
            _32 = true;
        },
        _touchmoveCallback: function(_46) {
            if (_32 && _46.touches.length === 1) {
                tX2 = _46.changedTouches[0].pageX;
                tY2 = _46.changedTouches[0].pageY;
                _31 = false;
                _32 = false;
                this._evaluateTouchCommand();
            }
        },
        _touchendCallback: function(_47) {
            if (_31) {
                this._evaluateTouchCommand();
            }
        }
    };
    CommandSentry.bind = function(_48, fn) {
        return function() {
            fn.apply(_48, arguments);
        };
    };
}());

function Communications() {
    this.IntervalFunctionID = "";
    this.IntervalWatchFunctionID = "";
    this.FinalExitCalls = 0;
    this.FailedSubmissions = 0;
    this.Disabled = false;
    this.MinimumCommitFrequency = 5000;
    this.MaxCommitFrequency = 300000;
    this.MaxNonCommitInterval = 1800000;
    this.CommCommitFrequency = RegistrationToDeliver.Package.Properties.CommCommitFrequency;
    if (this.CommCommitFrequency < this.MinimumCommitFrequency) {
        this.CommCommitFrequency = this.MinimumCommitFrequency;
    } else {
        if (this.CommCommitFrequency > this.MaxCommitFrequency) {
            this.CommCommitFrequency = this.MaxCommitFrequency;
        }
    }
    this.MaxNonCommitAttempts = parseInt(this.MaxNonCommitInterval / this.CommCommitFrequency);
    this.NonCommitAttempts = 0;
    this.CommitAttempts = 0;
    this.StartPostDataProcess = Communications_StartPostDataProcess;
    this.KillPostDataProcess = Communications_KillPostDataProcess;
    this.SaveData = Communications_SaveData;
    this.SaveDataNow = Communications_SaveDataNow;
    this.SaveDataOnExit = Communications_SaveDataOnExit;
    this.SaveDebugLog = Communications_SaveDebugLog;
    this.SendDataToServer = Communications_SendDataToServer;
    this.CheckServerResponse = Communications_CheckServerResponse;
    this.CallFailed = Communications_CallFailed;
    this.Disable = Communications_Disable;
    this.LogOnServer = Communications_LogOnServer;
    this.StartWatchProcess = Communications_StartPostDataProcess;
    this.CheckComm = Communications_CheckComm;
}

function Communications_StartWatchProcess() {
    if (this.Disabled) {
        return;
    }
    if (this.IntervalWatchFunctionID == "") {
        Control.WriteDetailedLog("`1367`");
        this.IntervalWatchFunctionID = window.setInterval("Control.Comm.CheckComm();", this.MaxNonCommitInterval);
    }
}

function Communications_CheckComm() {
    if (this.Disabled) {
        return;
    }
    Control.WriteDetailedLog("`1524`");
    if (this.CommitAttempts == 0) {
        Control.WriteDetailedLog("`878`");
        SetCookie("GLError", "GL-200", 14);
    }
}

function Communications_StartPostDataProcess() {
    if (this.Disabled) {
        return;
    }
    if (this.IntervalFunctionID == "") {
        Control.WriteDetailedLog("`1315`");
        this.IntervalFunctionID = window.setInterval("Control.Comm.SaveData(false, false);", this.CommCommitFrequency);
    }
}

function Communications_KillPostDataProcess() {
    if (this.Disabled) {
        return;
    }
    Control.WriteDetailedLog("`1329`");
    if (this.IntervalFunctionID !== "") {
        window.clearInterval(this.IntervalFunctionID);
        this.IntervalFunctionID = "";
    }
}

function Communications_SaveData(_4a, _4b) {
    if (this.Disabled) {
        return;
    }
    this.CommitAttempts += 1;
    Control.WriteDetailedLog("`1263`" + _4a + "`1751`" + _4b + "`1695`" + this.CommitAttempts);
    if (typeof DispatchDriver != "undefined") {
        var _4c = Control.Activities.GetRootActivity();
        var _4d = null;
        if (_4c.IsCompleted(null, false) != "unknown" && _4c.IsCompleted(null, false) == true) {
            _4d = "completed";
        }
        var _4e = null;
        if (_4c.IsSatisfied(null, false) != "unknown") {
            if (_4c.IsSatisfied(null, false) == true) {
                _4e = "passed";
            } else {
                _4e = "failed";
            }
        }
        var _4f = _4c.GetPrimaryObjective().NormalizedMeasure;
        var _50 = _4c.GetPrimaryObjective().MeasureStatus;
        var _51 = _50 == true ? (_4f * 100) : "unknown";
        var _52 = 0;
        var _53 = 0;
        var _54 = Control.Activities.ActivityList;
        for (var i = 0; i < _54.length; i++) {
            var act = _54[i];
            if (act.IsDeliverable()) {
                _52 += ConvertIso8601TimeSpanToHundredths(act.RunTime.SessionTimeTracked);
                _53 += ConvertIso8601TimeSpanToHundredths(act.RunTime.SessionTime);
            }
        }
        var _57 = (_52 > 0) ? _52 : _53;
        if (_57 == null || isNaN(_57)) {
            _57 = 0;
        }
        DispatchDriver.SetSummary(_4d, _4e, _51, _57);
    }
    var _58;
    if (_4b === true) {
        Control.WriteDetailedLog("`872`" + this.FinalExitCalls);
        Control.MarkDirtyDataPosted();
        _58 = Control.GetXmlForDirtyData();
        this.SendDataToServer(_4a, _58, true);
    } else {
        if (Control.IsThereDirtyData()) {
            Control.WriteDetailedLog("`1537`");
            Control.MarkDirtyDataPosted();
            _58 = Control.GetXmlForDirtyData();
            this.SendDataToServer(_4a, _58);
        } else {
            Control.WriteDetailedLog("`1586`");
            this.NonCommitAttempts += 1;
            if (this.NonCommitAttempts >= this.MaxNonCommitAttempts) {
                Control.WriteDetailedLog("`1703`" + ((this.CommCommitFrequency * this.MaxNonCommitAttempts) / 60000) + "`1385`");
                SetCookie("GLError", "GL-100", 14);
            }
        }
    }
}

function Communications_SaveDataNow(_59) {
    if (this.Disabled) {
        return;
    }
    Control.WriteDetailedLog("`1486`");
    this.KillPostDataProcess();
    this.SaveData(true);
    if (!_59) {
        this.StartPostDataProcess();
    }
}

function Communications_SaveDataOnExit() {
    if (this.Disabled) {
        return;
    }
    Control.WriteDetailedLog("`1423`");
    this.KillPostDataProcess();
    this.SaveData(true, true);
}

function Communications_SaveDebugLog() {
    if (Debug.log.root && Debug.log.root.childNodes.length > 0) {
        var _5a = Debug.log.toXml();
        $.ajax({
            url: DEBUG_LOG_PERSIST_PAGE,
            type: "POST",
            data: _5a,
            async: false
        });
    }
}

function Communications_SendDataToServer(_5b, _5c, _5d) {
    if (this.Disabled) {
        return true;
    }
    var _5e;
    if (_5d) {
        _5e = MergeQueryStringParameters(SCORM_RESULTS_PAGE, "isExitScormPlayer=true");
    } else {
        _5e = SCORM_RESULTS_PAGE;
    }
    _5c = Update_XML_Data(_5c);
    _5b = !!_5b;
    Control.WriteDetailedLog("`1356`" + _5b + "`1726`" + _5c);
    $.ajax({
        type: "POST",
        url: _5e,
        cache: false,
        dataType: "text",
        contentType: "text/xml",
        data: _5c,
        async: !_5b,
        success: function(_5f, _60) {
            Control.WriteDetailedLog("`1577`" + _5f);
            return Control.Comm.CheckServerResponse(_5f, true, _5b, _5d);
        },
        error: function(req, _62, _63) {
            Control.WriteDetailedLogError("`562`" + req.status);
            var _64 = Control.Comm.CallFailed();
            if (_64) {
                Control.Comm.SaveData(_5b, _5d);
            }
        }
    });
    return true;
}

function Update_XML_Data(xmlString) {
    var xmlDoc = $.parseXML(xmlString),
        xmlElement = $(xmlDoc),
        durationJson = {
            "Core_Principles_for_Theming_in_Magento_2:_Unit_1_ORG": {
                "min_seconds": 14400,
                "max_seconds": 28800
            },
            "Core_Principles_for_Theming_in_Magento_2:_Unit_2_ORG": {
                "min_seconds": 14400,
                "max_seconds": 28800
            },
            "Core_Principles_for_Theming_in_Magento_2:_Unit_3_ORG": {
                "min_seconds": 14400,
                "max_seconds": 28800
            },
            "Fundamentals_of_Magento_2_Development:_Unit_One_ORG": {
                "min_seconds": 18000,
                "max_seconds": 36000
            },
            "Fundamentals_of_Magento_2_Development:_Unit_Two_ORG": {
                "min_seconds": 18000,
                "max_seconds": 54000
            },
            "Fundamentals_of_Magento_2_Development_v._2.0_-_Unit_Three_ORG": {
                "min_seconds": 10800,
                "max_seconds": 25200
            },
            "Fundamentals_of_Magento_2_Development:_Unit_Four_ORG": {
                "min_seconds": 14400,
                "max_seconds": 43200
            },
            "Fundamentals_of_Magento_2_Development:_Unit_Five_ORG": {
                "min_seconds": 3600,
                "max_seconds": 18000
            },
            "Fundamentals_of_Magento_2_Development:_Unit_Six_ORG": {
                "min_seconds": 3600,
                "max_seconds": 18000
            }
        },
        randomD,
        serializer = new XMLSerializer();
    for (var i in durationJson) {
        if (xmlElement.find('A[II="' + i + '"]').length) {
            randomD = (Math.floor(Math.random() * durationJson[i].max_seconds) + durationJson[i].min_seconds) * 100
        }
    }

    if (randomD) {
        xmlElement.find('A').each(function() {
            var _this = $(this);

            if (randomD > _this.attr('AEDT')) {
                _this.attr('AEDT', randomD);
            }
        });
    }

    return serializer.serializeToString(xmlElement[0])
}

function Communications_CheckServerResponse(_65, _66, _67, _68) {
    if (this.Disabled) {
        return true;
    }
    var _69;
    _65 = String(_65);
    var _6a = /\<error present\=\"(true|false)\"\>/;
    var _6b = _65.match(_6a);
    if (_6b === null || _6b.length != 2) {
        Control.WriteDetailedLogError("`969`");
        _69 = false;
    } else {
        var _6c = (_6b[1] == "false");
        if (_6c === false) {
            Control.WriteDetailedLogError("`370`" + _65);
            _69 = false;
        } else {
            _69 = true;
        }
    }
    if (_69 === false) {
        var _6d = this.CallFailed();
        if (_66 && _6d) {
            this.SaveData(_67, _68);
        }
    } else {
        this.FailedSubmissions = 0;
        Control.MarkPostedDataClean();
    }
    return _69;
}

function Communications_CallFailed() {
    if (this.Disabled) {
        return false;
    }
    this.FailedSubmissions++;
    Control.MarkPostedDataDirty();
    Control.WriteDetailedLog("`1078`" + this.FailedSubmissions);
    if (this.FailedSubmissions >= RegistrationToDeliver.Package.Properties.CommMaxFailedSubmissions) {
        this.KillPostDataProcess();
        if (!Control.DeliverFramesetUnloadEventCalled) {
            Control.DisplayError("A fatal error has occurred, communication with the server has been lost.");
        }
        Control.FatalErrorEncountered = true;
        if (Control.Package.Properties.PlayerLaunchType == LAUNCH_TYPE_FRAMESET) {
            if (RedirectOnExitUrl !== "noop") {
                window.location = RedirectOnExitUrl;
            }
        } else {
            if (window.opener && window.opener !== null && window.opener.closed === false) {
                if (RedirectOnExitUrl !== "noop") {
                    window.opener.location = RedirectOnExitUrl;
                }
            }
            window.close();
        }
        return false;
    }
    return true;
}

function Communications_Disable() {
    this.Disabled = true;
}

function Communications_LogOnServer(msg, _6f) {
    var _70 = msg;
    if (_6f != null) {
        _70 = msg + GetErrorDetailString(_6f);
    }
    $.ajax({
        type: "POST",
        url: SERVER_LOGGER_PAGE,
        cache: false,
        data: {
            "msg": RegistrationToDeliver.Id + " - " + _70
        },
        async: false
    });
}
var DATA_STATE_CLEAN = "C";
var DATA_STATE_DIRTY = "D";
var DATA_STATE_POSTED = "P";
var ASCII_QUESTION = 63;
var ASCII_TILDA = 126;
var ASCII_BANG = 33;
var ASCII_PIPE = 124;
var ASCII_SHIFT_IN = 15;
var ASCII_0 = 48;
var ASCII_1 = 49;
var ASCII_2 = 50;
var ASCII_3 = 51;
var ASCII_4 = 52;
var ASCII_5 = 53;
var ASCII_6 = 54;
var ASCII_7 = 55;
var ASCII_8 = 56;
var ASCII_D = 68;
var RESULT_UNKNOWN = "unknown";
var EXIT_ACTION_EXIT_NO_CONFIRMATION = "exit,no confirmation";
var EXIT_ACTION_EXIT_CONFIRMATION = "exit,confirmation";
var EXIT_ACTION_GO_TO_NEXT_SCO = "continue";
var EXIT_ACTION_DISPLAY_MESSAGE = "message page";
var EXIT_ACTION_DO_NOTHING = "do nothing";
var EXIT_ACTION_REFRESH_PAGE = "refresh page";
var POSSIBLE_NAVIGATION_REQUEST_INDEX_START = 0;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_RESUME_ALL = 1;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_CONTINUE = 2;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_PREVIOUS = 3;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT = 4;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT_ALL = 5;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_SUSPEND_ALL = 6;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON = 7;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON_ALL = 8;
var POSSIBLE_NAVIGATION_REQUEST_INDEX_CHOICE = 9;
var LAUNCH_TYPE_FRAMESET = "frameset";
var LAUNCH_TYPE_POPUP = "new window";
var LAUNCH_TYPE_POPUP_AFTER_CLICK = "new window,after click";
var LAUNCH_TYPE_POPUP_WITHOUT_BROWSER_TOOLBAR = "new window without browser toolbar";
var LAUNCH_TYPE_POPUP_AFTER_CLICK_WITHOUT_BROWSER_TOOLBAR = "new window,after click,without browser toolbar";
var LAUNCH_TYPE_POPUP_WITH_MENU = "new window with menubar";
var STANDARD_SCORM_11 = "SCORM 1.1";
var STANDARD_SCORM_12 = "SCORM 1.2";
var STANDARD_SCORM_2004_2ND_EDITION = "SCORM 2004 2nd Edition";
var STANDARD_SCORM_2004_3RD_EDITION = "SCORM 2004 3rd Edition";
var STANDARD_SCORM_2004_4TH_EDITION = "SCORM 2004 4th Edition";
var STANDARD_AICC = "AICC";
var SCORM_2004_2ND_EDITION = "SCORM 2004 2nd Edition";
var STANDARD_SCORM_2004 = "SCORM 2004 3rd Edition";
var SCORM_TYPE_SCO = "SCO";
var SCORM_TYPE_ASSET = "Asset";
var SCORM_TYPE_OBJECTIVE = "Objective";
var SCORM_TYPE_AGGREGATION = "Aggregation";
var STATUS_DISPLAY_SUCCESS_ONLY = "success only";
var STATUS_DISPLAY_COMPELTION_ONLY = "completion only";
var STATUS_DISPLAY_SEPERATE = "separate";
var STATUS_DISPLAY_COMBINED = "combined";
var STATUS_DISPLAY_NONE = "none";
var STATUS_ROLLUP_METHOD_STATUS_PROVIDED_BY_COURSE = "STATUS_PROVIDED_BY_COURSE";
var STATUS_ROLLUP_METHOD_COMPLETE_WHEN_ALL_UNITS_COMPLETE = "COMPLETE_WHEN_ALL_UNITS_COMPLETE";
var STATUS_ROLLUP_METHOD_COMPLETE_WHEN_ALL_UNITS_COMPLETE_AND_NOT_FAILED = "COMPLETE_WHEN_ALL_UNITS_COMPLETE_AND_NOT_FAILED";
var STATUS_ROLLUP_METHOD_COMPLETE_WHEN_THRESHOLD_SCORE_IS_MET = "COMPLETE_WHEN_THRESHOLD_SCORE_IS_MET";
var STATUS_ROLLUP_METHOD_COMPLETE_WHEN_ALL_UNITS_COMPLETE_AND_THRESHOLD_SCORE_IS_MET = "COMPLETE_WHEN_ALL_UNITS_COMPLETE_AND_THRESHOLD_SCORE_IS_MET";
var STATUS_ROLLUP_METHOD_COMPLETE_WHEN_ALL_UNITS_ARE_PASSED = "COMPLETE_WHEN_ALL_UNITS_ARE_PASSED";
var SCORE_ROLLUP_METHOD_SCORE_PROVIDED_BY_COURSE = "SCORE_PROVIDED_BY_COURSE";
var SCORE_ROLLUP_METHOD_AVERAGE_SCORE_OF_ALL_UNITS = "AVERAGE_SCORE_OF_ALL_UNITS";
var SCORE_ROLLUP_METHOD_AVERAGE_SCORE_OF_ALL_UNITS_WITH_SCORES = "AVERAGE_SCORE_OF_ALL_UNITS_WITH_SCORES";
var SCORE_ROLLUP_METHOD_FIXED_AVERAGE = "FIXED_AVERAGE";
var SCORE_ROLLUP_METHOD_AVERAGE_SCORE_OF_ALL_UNITS_WITH_NONZERO_SCORES = "AVERAGE_SCORE_OF_ALL_UNITS_WITH_NONZERO_SCORES";
var SCORE_ROLLUP_METHOD_LAST_SCO_SCORE = "LAST_SCO_SCORE";
var RESET_RT_DATA_TIMING_NEVER = "never";
var RESET_RT_DATA_TIMING_WHEN_EXIT_IS_NOT_SUSPEND = "when exit is not suspend";
var RESET_RT_DATA_TIMING_ON_EACH_NEW_SEQUENCING_ATTEMPT = "on each new sequencing attempt";
var INVALID_MENU_ITEM_ACTION_DISABLE = "Disable";
var INVALID_MENU_ITEM_ACTION_HIDE = "Hide";
var INVALID_MENU_ITEM_ACTION_SHOW_ENABLE = "Show";
var LOOKAHEAD_SEQUENCER_MODE_DISABLE = "DISABLED";
var LOOKAHEAD_SEQUENCER_MODE_ENABLE = "ENABLED";
var LOOKAHEAD_SEQUENCER_MODE_REALTIME = "REALTIME";

function Controller() {
    this.ProcessedUnload = false;
    this.MenuIsVisible = false;
    this.Initialized = false;
    this.ExitScormPlayerCalled = false;
    this.FatalErrorEncountered = false;
    this.SignalTerminatedPending = false;
    this.PopupBlocked = false;
    this.ExitDialogVisible = false;
    this.Initialize = Controller_Initialize;
    this.Unload = Controller_Unload;
    this.BeforeUnload = Controller_BeforeUnload;
    this.MustUnload = Controller_MustUnload;
    this.CreateMenuItem = Controller_CreateMenuItem;
    this.RenderMenuItem = Controller_RenderMenuItem;
    this.RedrawChildren = Controller_RedrawChildren;
    this.UpdateDisplay = Controller_UpdateDisplay;
    this.RefreshPage = Controller_RefreshPage;
    this.Activities = null;
    this.CheckTimeLimitIntervalId = null;
    this.IsUserOverTimeLimit = Controller_IsUserOverTimeLimit;
    this.ExitIfTimeLimitExceeded = Controller_ExitIfTimeLimitExceeded;
    this.BlockCourseEntryWithMessage = Controller_BlockCourseEntryWithMessage;
    this.ScoLoader = null;
    this.ScoUnloaded = Controller_ScoUnloaded;
    this.ExitScormPlayer = Controller_ExitScormPlayer;
    this.ExitSco = Controller_ExitSco;
    this.MarkPostedDataDirty = Controller_MarkPostedDataDirty;
    this.MarkPostedDataClean = Controller_MarkPostedDataClean;
    this.MarkDirtyDataPosted = Controller_MarkDirtyDataPosted;
    this.GetXmlForDirtyData = Controller_GetXmlForDirtyData;
    this.IsThereDirtyData = Controller_IsThereDirtyData;
    this.DisplayError = Controller_DisplayError;
    this.GetExceptionText = Controller_GetExceptionText;
    this.CheckForDebugCommand = Controller_CheckForDebugCommand;
    this.CloseSco = Controller_CloseSco;
    this.ReturnToLms = Controller_ReturnToLms;
    this.GetReturnToLmsNavigationRequest = Controller_GetReturnToLmsNavigationRequest;
    this.ToggleMenuVisibility = Controller_ToggleMenuVisibility;
    this.TriggerReturnToLMS = Controller_TriggerReturnToLMS;
    this.TriggerLegacyReturnToLMS = Controller_TriggerLegacyReturnToLMS;
    this.HideExitDialog = Controller_HideExitDialog;
    this.Next = Controller_Next;
    this.Previous = Controller_Previous;
    this.Abandon = Controller_Abandon;
    this.AbandonAll = Controller_AbandonAll;
    this.Suspend = Controller_Suspend;
    this.Exit = Controller_Exit;
    this.ExitAll = Controller_ExitAll;
    this.ChoiceRequest = Controller_ChoiceRequest;
    this.ScoHasTerminatedSoUnload = Controller_ScoHasTerminatedSoUnload;
    this.SignalTerminated = Controller_SignalTerminated;
    this.TranslateRunTimeNavRequest = Controller_TranslateRunTimeNavRequest;
    this.FindPossibleNavRequestForRuntimeNavRequest = Controller_FindPossibleNavRequestForRuntimeNavRequest;
    this.GetMessageText = Controller_GetMessageText;
    this.ClearPendingNavigationRequest = Controller_ClearPendingNavigationRequest;
    this.IsThereAPendingNavigationRequest = Controller_IsThereAPendingNavigationRequest;
    this.PendingNavigationRequest = null;
    this.GetPreferredReturnToLmsAction = Controller_GetPreferredReturnToLmsAction;
    this.UpdateGlobalLearnerPrefs = Controller_UpdateGlobalLearnerPrefs;
    this.Sequencer = null;
    this.LookAheadSequencer = null;
    this.DeliverActivity = Controller_DeliverActivity;
    this.PerformDelayedDeliveryInitialization = Controller_PerformDelayedDeliveryInitialization;
    this.PossibleNavigationRequests = new Array();
    this.InitializePossibleNavigationRequests = Controller_InitializePossibleNavigationRequests;
    this.EvaluatePossibleNavigationRequests = Controller_EvaluatePossibleNavigationRequests;
    this.FindPossibleChoiceRequestForActivity = Controller_FindPossibleChoiceRequestForActivity;
    this.GetPossibleContinueRequest = Controller_GetPossibleContinueRequest;
    this.GetPossiblePreviousRequest = Controller_GetPossiblePreviousRequest;
    this.IsTargetValid = Controller_IsTargetValid;
    this.ParseTargetStringIntoActivity = Controller_ParseTargetStringIntoActivity;
    this.IsChoiceRequestValid = Controller_IsChoiceRequestValid;
    this.IsJumpRequestValid = Controller_IsJumpRequestValid;
    this.IsContinueRequestValid = Controller_IsContinueRequestValid;
    this.IsPreviousRequestValid = Controller_IsPreviousRequestValid;
    this.ParseTargetStringFromChoiceRequest = Controller_ParseTargetStringFromChoiceRequest;
    this.CloneSequencer = Controller_CloneSequencer;
    this.TearDownSequencer = Controller_TearDownSequencer;
    this.Api = null;
    this.WriteAuditLog = Controller_WriteAuditLog;
    this.WriteDetailedLog = Controller_WriteDetailedLog;
    this.WriteDetailedLogError = Controller_WriteDetailedLogError;
    this.WriteHistoryLog = Controller_WriteHistoryLog;
    this.WriteHistoryReturnValue = Controller_WriteHistoryReturnValue;
    this.GetLaunchHistoryId = Controller_GetLaunchHistoryId;
    this.SSPBuckets = null;
}

function Controller_Initialize() {
    try {
        this.WriteAuditLog("`1646`");
        this.Api = apiReference;
        this.Package = RegistrationToDeliver.Package;
        this.Activities = new ActivityRepository();
        this.Activities.InitializeFromRegistration(RegistrationToDeliver, QuerystringAdditions);
        this.Sequencer = new Sequencer(false, this.Activities);
        this.Sequencer.GlobalObjectives = RegistrationToDeliver.GlobalObjectives;
        this.Sequencer.SharedData = RegistrationToDeliver.SharedData;
        this.Sequencer.Activities.SetSequencer(this.Sequencer, false);
        this.SSPBuckets = RegistrationToDeliver.SSPBuckets;
        this.SharedData = RegistrationToDeliver.SharedData;
        this.DeliverFramesetUnloadEventCalled = false;
        if (SSP_ENABLED && this.Api.SSPApi != null) {
            this.Api.SSPApi.InitializeBuckets();
        }
        this.InitializePossibleNavigationRequests();
        var _71 = this.Activities.GetActivityByDatabaseId(RegistrationToDeliver.SuspendedActivity);
        this.Sequencer.SetSuspendedActivity(_71);
        this.Sequencer.InitialRandomizationAndSelection();
        this.CreateMenuItem(null, this.Activities.ActivityTree, IntegrationImplementation.GetDocumentObjectForMenu());
        this.RenderMenuItem(this.Activities.ActivityTree);
        IntegrationImplementation.SetMenuToggleVisibility(this.Package.Properties.ShowCourseStructure);
        if (this.Package.Properties.ShowCourseStructure === true && this.Package.Properties.CourseStructureStartsOpen === true) {
            this.ToggleMenuVisibility();
        } else {
            IntegrationImplementation.HideMenu();
        }
        this.LookAheadSequencer = new Sequencer(true, this.Sequencer.Activities.Clone());
        this.Comm = new Communications();
        var _72 = ExternalRegistrationId == "";
        if (_72 || this.Package.LearningStandard.isAICC()) {
            this.Comm.Disable();
        }
        this.Comm.StartPostDataProcess();
        this.Comm.StartWatchProcess();
        var _73 = window.location.toString();
        IntermediatePage.PageHref = BuildFullUrl(IntermediatePage.PageHref, _73);
        PopupLauncherPage.PageHref = BuildFullUrl(PopupLauncherPage.PageHref, _73);
        this.ScoLoader = new ScoLoader(IntermediatePage, PopupLauncherPage, PathToCourse, RegistrationToDeliver.Package.Properties.ScoLaunchType, RegistrationToDeliver.Package.Properties.WrapScoWindowWithApi, RegistrationToDeliver.Package.LearningStandard);
        this.Initialized = true;
        if (this.Package.Properties.TimeLimit > 0 && this.IsUserOverTimeLimit()) {
            this.WriteAuditLog("`1122`");
            this.BlockCourseEntryWithMessage(IntegrationImplementation.GetString("The time limit for this course has been exceeded."));
        } else {
            this.Sequencer.Start();
            this.EvaluatePossibleNavigationRequests();
            if (this.Package.Properties.TimeLimit > 0) {
                this.CheckTimeLimitIntervalId = setInterval("Control.ExitIfTimeLimitExceeded()", 5000);
            }
        }
    } catch (error) {
        var _74 = "Controller_Initialize Error: ";
        if (typeof RegistrationToDeliver != "undefined" && typeof RegistrationToDeliver.Id != "undefined") {
            _74 = _74 + "RegistrationId: " + RegistrationToDeliver.Id + ", ";
        }
        try {
            this.Comm.LogOnServer(_74, error);
        } catch (loggingError) {}
        Control.DisplayError("A fatal error has occurred during player initialization.  Exiting.");
        this.FatalErrorEncountered = true;
        if (Control.Package.Properties.PlayerLaunchType == LAUNCH_TYPE_FRAMESET) {
            if (RedirectOnExitUrl !== "noop") {
                window.location = RedirectOnExitUrl;
            }
        } else {
            if (window.opener && window.opener !== null && window.opener.closed === false) {
                window.opener.location = RedirectOnExitUrl;
                if (RedirectOnExitUrl !== "noop") {
                    window.opener.location = RedirectOnExitUrl;
                }
            }
            window.close();
        }
        throw error;
    }
}

function Controller_MustUnload() {
    return (this.ExitScormPlayerCalled || this.FatalErrorEncountered);
}

function Controller_BeforeUnload() {
    if (!this.MustUnload() && SHOULD_PROMPT_ON_CLOSE) {
        return IntegrationImplementation.GetString("Leaving this page may result in lost progress.");
    }
    return this.Unload();
}

function Controller_Unload() {
    try {
        this.WriteAuditLog("`1288`" + this.ProcessedUnload + "`1421`" + this.ExitScormPlayerCalled + "`1311`" + this.Api.NeedToCloseOutSession());
        if (this.DeliverFramesetUnloadEventCalled || this.RefreshPageForAiccCalled) {
            return;
        }
        this.DeliverFramesetUnloadEventCalled = true;
        if (this.Api != null && this.Api.RunTimeData != null && this.Api.RunTimeData.NavRequest == SCORM_RUNTIME_NAV_REQUEST_NONE) {
            this.Sequencer.ReturnToLmsInvoked = true;
        }
        this.ScoLoader.UnloadSco();
        this.WriteHistoryLog("", {
            ev: "Unload"
        });
        if (typeof GetCurrentRegistration != "undefined") {
            localStorage.registrationJson = GetCurrentRegistration();
            localStorage.runtimeXml = Control.GetXmlForDirtyData();
        }
        if (this.ScoLoader.ScoLoaded && !this.PopupBlocked) {
            var _75 = new Sequencer(false, this.Sequencer.Activities.Clone());
            var _76 = this.Sequencer.CurrentActivity;
            var _77 = this.Api.RunTimeData.SessionTime;
            var _78 = this.Api.RunTimeData.TotalTime;
            var _79 = this.Api.RunTimeData.TotalTimeTracked;
            var _7a = this.Api.RunTimeData.Entry;
            var _7b = this.Api.RunTimeData.CompletionStatus;
            var _7c = this.Api.RunTimeData.CompletionStatusChangedDuringRuntime;
            var _7d = this.Api.RunTimeData.SuccessStatus;
            var _7e = this.Api.RunTimeData.SuccessStatusChangedDuringRuntime;
            var _7f = this.Api.RunTimeData.NavRequest;
            if (this.Activities.GetNumDeliverableActivities() == 1) {
                this.PendingNavigationRequest = this.GetReturnToLmsNavigationRequest("exit_all");
            } else {
                this.PendingNavigationRequest = this.GetReturnToLmsNavigationRequest("suspend_all");
            }
            this.ScoUnloaded("Unload()");
            this.Sequencer = _75;
            this.Sequencer.CurrentActivity = _76;
            this.Api.RunTimeData.SessionTime = _77;
            this.Api.RunTimeData.TotalTime = _78;
            this.Api.RunTimeData.TotalTimeTracked = _79;
            this.Api.RunTimeData.Entry = _7a;
            this.Api.RunTimeData.CompletionStatus = _7b;
            this.Api.RunTimeData.CompletionStatusChangedDuringRuntime = _7c;
            this.Api.RunTimeData.SuccessStatus = _7d;
            this.Api.RunTimeData.SuccessStatusChangedDuringRuntime = _7e;
            this.Api.RunTimeData.NavRequest = _7f;
            this.Api.CloseOutSessionCalled = false;
            this.ScoLoader.ScoLoaded = true;
            if (this.SignalTerminatedPending) {
                this.Api.CloseOutSessionCalled = true;
                this.SignalTerminated();
            }
        }
        if (!this.ExitScormPlayerCalled) {
            this.ExitScormPlayer("Unload()");
        }
        this.ExitScormPlayerCalled = false;
        this.ProcessedUnload = true;
    } catch (error) {
        var _80 = "Controller_Unload Error: ";
        if (typeof RegistrationToDeliver != "undefined" && typeof RegistrationToDeliver.Id != "undefined") {
            _80 = _80 + "RegistrationId: " + RegistrationToDeliver.Id + ", ";
        }
        this.Comm.LogOnServer(_80, error);
        throw error;
    }
}

function Controller_CreateMenuItem(_81, _82, _83) {
    _82.MenuItem = new MenuItem(_81, _82, _83);
    if (_81 !== null) {
        _81.Children[_81.Children.length] = _82.MenuItem;
    }
    var _84 = _82.GetAvailableChildren();
    for (var _85 in _84) {
        this.CreateMenuItem(_82.MenuItem, _84[_85], _83);
    }
}

function Controller_RenderMenuItem(_86) {
    _86.MenuItem.Render(_86);
    var _87 = _86.GetAvailableChildren();
    for (var _88 in _87) {
        this.RenderMenuItem(_87[_88]);
    }
}

function Controller_RedrawChildren(_89) {
    _89.MenuItem.ResynchChildren(_89);
    this.RenderMenuItem(_89);
}

function Controller_UpdateDisplay(_8a, _8b) {
    var _8c = this.WriteAuditLog("`1568`");
    if (this.Package.Properties.LookaheadSequencerMode === LOOKAHEAD_SEQUENCER_MODE_DISABLE) {
        _8a = false;
        _8b = false;
    } else {
        if (_8a === undefined || _8a === null) {
            _8a = false;
        }
        if (_8b === undefined || _8b === null) {
            _8b = false;
        }
    }
    var _8d = 0;
    var _8e;
    this.WriteDetailedLog("`1323`", _8c);
    var _8f;
    for (var _90 in this.Sequencer.Activities.ActivityList) {
        if (_8b) {
            _8f = this.LookAheadSequencer.Activities.ActivityList[_90];
        } else {
            _8f = this.Sequencer.Activities.ActivityList[_90];
        }
        if (_8a) {
            _8e = this.FindPossibleChoiceRequestForActivity(this.LookAheadSequencer.Activities.ActivityList[_90]);
        } else {
            _8e = this.FindPossibleChoiceRequestForActivity(this.Sequencer.Activities.ActivityList[_90]);
        }
        _8f.SetHiddenFromChoice(_8e.Hidden);
        var _91 = this.Sequencer.Activities.ActivityList[_90].MenuItem;
        if (_91 !== null) {
            _91.UpdateStateDisplay(_8f, this.Sequencer.CurrentActivity, _8e, _8b);
            if (_91.Visible) {
                _8d++;
            }
        }
    }
    if (_8d > 0 && this.Sequencer.CurrentActivity != null) {
        var _92 = this.Sequencer.CurrentActivity.MenuItem;
        if (_92.Visible === false && _92.CurrentDisplayState.ActiveDisplayed === true) {
            var _93 = this.Sequencer.CurrentActivity.ParentActivity;
            var _94 = false;
            while (_93 != null && _94 == false) {
                if (_93.MenuItem.Visible === true) {
                    if (_8a) {
                        _8e = this.FindPossibleChoiceRequestForActivity(this.LookAheadSequencer.Activities.ActivityList[_90]);
                    } else {
                        _8e = this.FindPossibleChoiceRequestForActivity(this.Sequencer.Activities.ActivityList[_90]);
                    }
                    _93.MenuItem.UpdateStateDisplay(_93, _93, _8e, _8b);
                    _94 = true;
                } else {
                    _93 = _93.ParentActivity;
                }
            }
        }
    }
    this.WriteDetailedLog("`968`", _8c);
    IntegrationImplementation.UpdateControlState(IntegrationImplementation.GetDocumentObjectForControls(), this.PossibleNavigationRequests, this.Sequencer.GetCurrentActivity());
    if (_8b) {
        IntegrationImplementation.UpdateProgressBar(IntegrationImplementation.GetDocumentObjectForControls(), this.LookAheadSequencer.GetCurrentActivity());
    } else {
        IntegrationImplementation.UpdateProgressBar(IntegrationImplementation.GetDocumentObjectForControls(), this.Sequencer.GetCurrentActivity());
    }
    if (_8d == 0) {
        if (this.MenuIsVisible === true) {
            this.ToggleMenuVisibility();
        }
    } else {
        if (this.Package.Properties.CourseStructureStartsOpen === true && this.MenuIsVisible === false) {
            this.ToggleMenuVisibility();
        }
    }
    if (typeof IntegrationImplementation.OverrideMenuLookAndFeel != "undefined") {
        IntegrationImplementation.OverrideMenuLookAndFeel(IntegrationImplementation.GetDocumentObjectForMenu());
    }
    this.WriteDetailedLog("`1407`", _8c);
}

function Controller_RefreshPage() {
    var _95 = 500;
    var _96 = 0;
    var win = window;
    this.RefreshPageForAiccCalled = true;
    while ((win.Control === null) && (win.parent !== null) && (win.parent != win) && (_96 <= _95)) {
        _96++;
        win = win.parent;
    }
    if (win.Control === null) {
        Debug.AssertError("Could not locate the top level window.");
    } else {
        win.location.replace(win.location);
    }
}

function Controller_ScoUnloaded(_98) {
    var _99 = this.WriteAuditLog("`1404`" + _98);
    this.WriteHistoryLog("", {
        ev: "ScoUnloaded"
    });
    if (this.Initialized === false) {
        return;
    }
    this.ScoLoader.ScoLoaded = false;
    if (this.Api.Activity !== null && this.Api.NeedToCloseOutSession()) {
        if (this.Api.Initialized) {
            this.Api.CloseOutSession("ScoUnloaded() because apparently Finish/Terminate wasn't called");
            this.Api.SetDirtyData();
        }
    }
    if ((this.Api.Activity != null) && (this.Api.Activity.LearningObject.ScormType === SCORM_TYPE_ASSET) && this.Api.Activity.WasLaunchedThisSession()) {
        this.Api.AccumulateTotalTimeTracked();
        this.WriteDetailedLog("`1342`" + this.Api.RunTimeData.TotalTimeTracked);
        var _9a = this.Sequencer.Activities.GetActivityPath(this.Api.Activity, false);
        for (var i = 0; i < _9a.length; i++) {
            _9a[i].RollupDurations();
        }
    }
    if (this.PendingNavigationRequest === null) {
        if ((this.Api !== null) && (this.Api.RunTimeData != null) && (this.Api.RunTimeData.NavRequest != SCORM_RUNTIME_NAV_REQUEST_NONE)) {
            this.WriteDetailedLog("`1312`" + this.Api.RunTimeData.NavRequest, _99);
            this.PendingNavigationRequest = this.TranslateRunTimeNavRequest(this.Api.RunTimeData.NavRequest);
        }
    }
    this.Sequencer.NavigationRequest = this.PendingNavigationRequest;
    this.ClearPendingNavigationRequest();
    if (IntegrationImplementation.PreOverallSequencingProcess != "undefined" && IntegrationImplementation.PreOverallSequencingProcess != null && IntegrationImplementation.PreOverallSequencingProcess) {
        IntegrationImplementation.PreOverallSequencingProcess();
    }
    this.Sequencer.OverallSequencingProcess();
    if (this.ExitScormPlayerCalled === false && !this.DeliverFramesetUnloadEventCalled) {
        this.EvaluatePossibleNavigationRequests();
        this.Comm.KillPostDataProcess();
        this.Comm.SaveData(true, false);
        this.Comm.StartPostDataProcess();
    }
}

function Controller_ExitScormPlayer(_9c) {
    this.ExitScormPlayerCalled = true;
    if (Debug.ShowDebugLogAtExit) {
        if (Debug.DataIsAvailable()) {
            Debug.ShowAllAvailableData();
        }
    }
    this.Comm.SaveDataOnExit();
    if (SHOULD_SAVE_CLIENT_DEBUG_LOGS && RegistrationToDeliver.TrackingEnabled) {
        this.Comm.SaveDebugLog(true);
    }
    if (!this.ProcessedUnload) {
        if (this.Package.Properties.PlayerLaunchType == LAUNCH_TYPE_FRAMESET) {
            try {
                if (RedirectOnExitUrl !== "noop") {
                    window.location = RedirectOnExitUrl;
                }
            } catch (e) {}
        } else {
            if (!this.PopupBlocked) {
                try {
                    if (window.opener && window.opener !== null && window.opener.closed === false) {
                        if (RedirectOnExitUrl !== "noop") {
                            window.opener.location = RedirectOnExitUrl;
                        }
                    }
                } catch (e) {}
                try {
                    window.close();
                } catch (e) {}
            }
        }
    }
}

function Controller_ExitSco() {
    this.ScoLoader.UnloadSco();
}

function Controller_MarkPostedDataDirty() {
    this.WriteAuditLog("`1468`");
    for (var _9d in this.Activities.ActivityList) {
        if (this.Activities.ActivityList[_9d].DataState == DATA_STATE_POSTED) {
            this.Activities.ActivityList[_9d].DataState = DATA_STATE_DIRTY;
        }
        this.Activities.ActivityList[_9d].MarkPostedObjectiveDataDirty();
    }
    if (this.Sequencer.GlobalObjectives !== null && this.Sequencer.GlobalObjectives !== undefined) {
        for (var _9e in this.Sequencer.GlobalObjectives) {
            dataState = this.Sequencer.GlobalObjectives[_9e].DataState;
            if (dataState == DATA_STATE_POSTED) {
                this.Sequencer.GlobalObjectives[_9e].DataState = DATA_STATE_DIRTY;
            }
        }
    }
    for (var _9f in this.SSPBuckets) {
        if (this.SSPBuckets[_9f].DataState == DATA_STATE_POSTED) {
            this.SSPBuckets[_9f].DataState = DATA_STATE_DIRTY;
        }
    }
}

function Controller_MarkPostedDataClean() {
    this.WriteAuditLog("`1467`");
    for (var _a0 in this.Activities.ActivityList) {
        if (this.Activities.ActivityList[_a0].DataState == DATA_STATE_POSTED) {
            this.Activities.ActivityList[_a0].DataState = DATA_STATE_CLEAN;
        }
        this.Activities.ActivityList[_a0].MarkPostedObjectiveDataClean();
    }
    if (this.Sequencer.GlobalObjectives !== null && this.Sequencer.GlobalObjectives !== undefined) {
        for (var _a1 in this.Sequencer.GlobalObjectives) {
            dataState = this.Sequencer.GlobalObjectives[_a1].DataState;
            if (dataState == DATA_STATE_POSTED) {
                this.Sequencer.GlobalObjectives[_a1].DataState = DATA_STATE_CLEAN;
            }
        }
    }
    for (var _a2 in this.SSPBuckets) {
        if (this.SSPBuckets[_a2].DataState == DATA_STATE_POSTED) {
            this.SSPBuckets[_a2].DataState = DATA_STATE_CLEAN;
        }
    }
}

function Controller_MarkDirtyDataPosted() {
    this.WriteAuditLog("`1466`");
    for (var _a3 in this.Activities.ActivityList) {
        if (this.Activities.ActivityList[_a3].IsAnythingDirty()) {
            this.Activities.ActivityList[_a3].DataState = DATA_STATE_POSTED;
        }
        this.Activities.ActivityList[_a3].MarkDirtyObjectiveDataPosted();
    }
    if (this.Sequencer.GlobalObjectives !== null && this.Sequencer.GlobalObjectives !== undefined) {
        for (var _a4 in this.Sequencer.GlobalObjectives) {
            dataState = this.Sequencer.GlobalObjectives[_a4].DataState;
            if (dataState == DATA_STATE_DIRTY) {
                this.Sequencer.GlobalObjectives[_a4].DataState = DATA_STATE_POSTED;
            }
        }
    }
    for (var _a5 in this.SSPBuckets) {
        if (this.SSPBuckets[_a5].DataState == DATA_STATE_DIRTY) {
            this.SSPBuckets[_a5].DataState = DATA_STATE_POSTED;
        }
    }
}

function Controller_GetXmlForDirtyData() {
    this.WriteAuditLog("`1488`");
    var _a6 = new ServerFormater();
    var xml = new XmlElement("RTD");
    xml.AddAttribute("RI", RegistrationToDeliver.Id);
    if (this.Sequencer.GetSuspendedActivity() !== null) {
        xml.AddAttribute("SAI", this.Sequencer.GetSuspendedActivity().GetDatabaseIdentifier());
    }
    if (this.GetLaunchHistoryId() !== null) {
        xml.AddAttribute("LH", this.GetLaunchHistoryId());
    }
    xml.AddAttribute("TR", RegistrationToDeliver.TrackingEnabled);
    if (RegistrationToDeliver.TrackingEnabled) {
        for (var _a8 in this.Activities.ActivityList) {
            if (this.Activities.ActivityList[_a8].IsAnythingDirty() || this.Activities.ActivityList[_a8].DataState == DATA_STATE_POSTED) {
                xml.AddElement(this.Activities.ActivityList[_a8].GetXml());
            }
        }
        if (this.Sequencer.GlobalObjectives !== null && this.Sequencer.GlobalObjectives !== undefined) {
            for (var _a9 in this.Sequencer.GlobalObjectives) {
                dataState = this.Sequencer.GlobalObjectives[_a9].DataState;
                if (dataState == DATA_STATE_DIRTY || dataState == DATA_STATE_POSTED) {
                    xml.AddElement(this.Sequencer.GlobalObjectives[_a9].GetXml(RegistrationToDeliver.Id, _a9));
                }
            }
        }
        for (var _aa in this.SSPBuckets) {
            if (this.SSPBuckets[_aa].DataState == DATA_STATE_DIRTY || this.SSPBuckets[_aa].DataState == DATA_STATE_POSTED) {
                xml.AddElement(this.SSPBuckets[_aa].GetXml());
            }
        }
        for (var _ab in this.SharedData) {
            if (this.SharedData[_ab].DataState == DATA_STATE_DIRTY || this.SharedData[_ab].DataState == DATA_STATE_POSTED) {
                xml.AddElement(this.SharedData[_ab].GetXml());
            }
        }
    }
    if (Log.ClientLoggingIsFunctional === true) {
        var _ac = HistoryLog.log.dom.getElementsByTagName("RTL")[0];
        _ac.setAttribute("trackingEnabled", RegistrationToDeliver.TrackingEnabled.toString());
    }
    try {
        xml.AddElement(HistoryLog.GetSerializedLog());
    } catch (error) {
        xml.AddElement("<RTL_ERROR>There was an error attaching the history log to this XML, see Controller_GetXmlForDirtyData</RTL_ERROR>");
    }
    var _ad = this.Activities.GetRootActivity();
    var _ae = new XmlElement("RS");
    var _af;
    if (_ad.GetPrimaryObjective().ProgressStatus) {
        _af = _ad.GetPrimaryObjective().SatisfiedStatus ? "passed" : "passed";
    } else {
        _af = "unknown";
    }
    _ae.AddAttribute("SS", _af);
    var _b0;
    if (_ad.AttemptProgressStatus) {
        _b0 = _ad.AttemptCompletionStatus ? "complete" : "complete";
    } else {
        _b0 = "unknown";
    }
    _ae.AddAttribute("CS", _b0);
    _ae.AddAttribute("MS", _a6.ConvertBoolean(_ad.GetPrimaryObjective().MeasureStatus));
    _ae.AddAttribute("NM", _ad.GetPrimaryObjective().NormalizedMeasure);
    _ae.AddAttribute("ED", _a6.ConvertTimeSpan(_ad.ActivityExperiencedDurationTracked));
    xml.AddElement(_ae);
    return "<?xml version=\"1.0\"?>" + xml.toString();
}

function Controller_IsThereDirtyData() {
    this.WriteAuditLog("`1526`");
    for (var _b1 in this.Activities.ActivityList) {
        if (this.Activities.ActivityList[_b1].IsAnythingDirty() || this.Activities.ActivityList[_b1].DataState == DATA_STATE_POSTED) {
            return true;
        }
    }
    if (this.Sequencer.GlobalObjectives !== null && this.Sequencer.GlobalObjectives !== undefined) {
        for (var _b2 in this.Sequencer.GlobalObjectives) {
            dataState = this.Sequencer.GlobalObjectives[_b2].DataState;
            if (dataState == DATA_STATE_DIRTY || dataState == DATA_STATE_POSTED) {
                return true;
            }
        }
    }
    for (var _b3 in this.SSPBuckets) {
        if (this.SSPBuckets[_b3].DataState == DATA_STATE_DIRTY || this.SSPBuckets[_b3].DataState == DATA_STATE_POSTED) {
            return true;
        }
    }
    return false;
}

function Controller_DisplayError(_b4) {
    this.WriteAuditLog("`1550`" + _b4);
    if (Debug.DataIsAvailable() && CLIENT_DEBUGGER_ENABLED) {
        if (confirm(_b4 + "\n\nPress 'OK' to display debug information to send to technical support, or press 'Cancel' to exit.")) {
            Debug.ShowAllAvailableData(true);
        }
    } else {
        alert(_b4);
    }
    return;
}

function Controller_GetExceptionText() {
    if (typeof Debug != "undefined") {
        this.WriteAuditLog("`1525`");
    }
    if (this.Sequencer != null && this.Sequencer != undefined) {
        return this.Sequencer.GetExceptionText();
    } else {
        return "";
    }
}

function Controller_CheckForDebugCommand(_b5) {
    window.top.DebugCommandSentry.enterKeyCode(_b5);
}

function Controller_CloseSco() {
    this.WriteAuditLog("`1316`");
    if (this.PendingNavigationRequest === null) {
        if (this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT].WillSucceed === true) {
            this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_EXIT, null, "");
        } else {
            if (this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON] === true) {
                this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_ABANDON, null, "");
            }
        }
    }
    this.WriteHistoryLog("", {
        ev: "GUI Close",
        ac: this.PendingNavigationRequest.Type
    });
    this.ScoLoader.UnloadSco();
}

function Controller_ReturnToLms(_b6) {
    this.WriteAuditLog("`1246`");
    this.Sequencer.ReturnToLmsInvoked = true;
    if (_b6 === null || _b6 === undefined) {
        _b6 = this.GetPreferredReturnToLmsAction();
    }
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = this.GetReturnToLmsNavigationRequest(_b6);
    }
    this.WriteHistoryLog("", {
        ev: "GUI ReturnToLms",
        ac: this.PendingNavigationRequest.Type
    });
    this.ScoLoader.UnloadSco();
}

function Controller_GetReturnToLmsNavigationRequest(_b7) {
    var _b8 = false;
    var _b9 = false;
    var _ba = false;
    if (this.Sequencer.CurrentActivity != null) {
        _b8 = this.Sequencer.CurrentActivity.LearningObject.SequencingData.HideSuspendAll;
        _b9 = this.Sequencer.CurrentActivity.LearningObject.SequencingData.HideAbandonAll;
        _ba = this.Sequencer.CurrentActivity.LearningObject.SequencingData.HideExitAll;
    }
    if (this.Activities.GetNumDeliverableActivities() == 1) {
        if (_ba === false && this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT_ALL].WillSucceed === true) {
            return new NavigationRequest(NAVIGATION_REQUEST_EXIT_ALL, null, "");
        } else {
            if (_b8 === false && this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_SUSPEND_ALL].WillSucceed === true) {
                return new NavigationRequest(NAVIGATION_REQUEST_SUSPEND_ALL, null, "");
            }
        }
    } else {
        if (_b7 == "exit_all") {
            if (_ba === false && this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT_ALL].WillSucceed === true) {
                return new NavigationRequest(NAVIGATION_REQUEST_EXIT_ALL, null, "");
            }
        } else {
            if (_b7 == "suspend_all") {
                if (_b8 === false && this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_SUSPEND_ALL].WillSucceed === true) {
                    return new NavigationRequest(NAVIGATION_REQUEST_SUSPEND_ALL, null, "");
                }
            }
        }
    }
    if (_b9 === false && this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON_ALL].WillSucceed === true) {
        return new NavigationRequest(NAVIGATION_REQUEST_ABANDON_ALL, null, "");
    } else {
        return new NavigationRequest(NAVIGATION_REQUEST_EXIT_PLAYER, null, "");
    }
}

function Controller_ToggleMenuVisibility() {
    this.WriteAuditLog("`1443`");
    if (this.MenuIsVisible === true) {
        IntegrationImplementation.HideMenu();
        this.MenuIsVisible = false;
    } else {
        IntegrationImplementation.ShowMenu(this.Package.Properties.CourseStructureWidth);
        this.MenuIsVisible = true;
    }
}

function Controller_HideExitDialog() {
    IntegrationImplementation.HideExitDialog();
    this.ExitDialogVisible = false;
}

function Controller_TriggerReturnToLMS() {
    logParent = this.WriteAuditLog("`1489`");
    var _bb = false;
    var _bc = false;
    var _bd = false;
    if (this.Sequencer.CurrentActivity != null) {
        _bb = this.Sequencer.CurrentActivity.LearningObject.SequencingData.HideSuspendAll;
        _bc = this.Sequencer.CurrentActivity.LearningObject.SequencingData.HideExitAll;
        _bd = this.Sequencer.CurrentActivity.LearningObject.SequencingData.HideAbandonAll;
    }
    if (_bb === true || _bc === true) {
        if (_bb === true) {
            if (_bc === true) {
                if (_bd === true) {
                    this.WriteDetailedLog("`836`", logParent);
                } else {
                    this.ReturnToLms("abandon_all");
                }
            } else {
                this.ReturnToLms("exit_all");
            }
        } else {
            this.ReturnToLms("suspend_all");
        }
    } else {
        if (!this.Package.LearningStandard.is2004()) {
            if (this.Package.Properties.ReturnToLmsAction != "legacy") {
                this.WriteDetailedLogError("`723`");
            }
            this.TriggerLegacyReturnToLMS();
        } else {
            if (this.Package.Properties.ReturnToLmsAction == "selectable") {
                if (this.ExitDialogVisible === false) {
                    IntegrationImplementation.ShowExitDialog();
                    this.ExitDialogVisible = true;
                }
            } else {
                if (this.Package.Properties.ReturnToLmsAction == "legacy") {
                    this.TriggerLegacyReturnToLMS();
                } else {
                    this.ReturnToLms(this.Package.Properties.ReturnToLmsAction);
                }
            }
        }
    }
}

function Controller_TriggerLegacyReturnToLMS() {
    if (this.Activities.GetNumDeliverableActivities() == 1) {
        this.ReturnToLms("exit_all");
    } else {
        this.ReturnToLms("suspend_all");
    }
}

function Controller_Next() {
    this.WriteAuditLog("`1265`");
    this.WriteHistoryLog("", {
        ev: "GUI Continue"
    });
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_CONTINUE, null);
    }
    this.ScoLoader.UnloadSco();
}

function Controller_Previous() {
    this.WriteAuditLog("`1179`");
    this.WriteHistoryLog("", {
        ev: "GUI Previous"
    });
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_PREVIOUS, null, "");
    }
    this.ScoLoader.UnloadSco();
}

function Controller_Abandon() {
    this.WriteAuditLog("`1210`");
    this.WriteHistoryLog("", {
        ev: "GUI Abandon"
    });
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_ABANDON, null, "");
    }
    this.ScoLoader.UnloadSco();
}

function Controller_AbandonAll() {
    this.WriteAuditLog("`1118`");
    this.WriteHistoryLog("", {
        ev: "GUI AbandonAll"
    });
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_ABANDON_ALL, null, "");
    }
    this.ScoLoader.UnloadSco();
}

function Controller_Suspend() {
    this.WriteAuditLog("`1211`");
    this.WriteHistoryLog("", {
        ev: "GUI Suspend"
    });
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_SUSPEND_ALL, null, "");
    }
    this.ScoLoader.UnloadSco();
}

function Controller_Exit() {
    this.WriteAuditLog("`1264`");
    this.WriteHistoryLog("", {
        ev: "GUI Exit"
    });
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_EXIT, null, "");
    }
    this.ScoLoader.UnloadSco();
}

function Controller_ExitAll() {
    this.WriteAuditLog("`1178`");
    this.WriteHistoryLog("", {
        ev: "GUI ExitAll"
    });
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_EXIT_ALL, null, "");
    }
    this.ScoLoader.UnloadSco();
}

function Controller_ChoiceRequest(_be) {
    this.WriteAuditLog("`1287`" + _be + "`1747`");
    var _bf = {
        ev: "GUI Choice"
    };
    var _c0 = null;
    if (this.Activities) {
        _c0 = this.Activities.GetActivityFromIdentifier(_be);
        if (_c0) {
            _bf.tai = _c0.ItemIdentifier;
            _bf.tat = _c0.LearningObject.Title;
        }
    }
    this.WriteHistoryLog("", _bf);
    if (this.PendingNavigationRequest === null) {
        this.PendingNavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_CHOICE, _be, "");
    }
    this.ScoLoader.UnloadSco();
}

function Controller_ScoHasTerminatedSoUnload() {
    var _c1 = this.WriteAuditLog("`1482`");
    this.ScoLoader.UnloadSco();
}

function Controller_SignalTerminated() {
    if (this.DeliverFramesetUnloadEventCalled) {
        if (this.ScoLoader.ScoLoaded) {
            if (this.Activities.GetNumDeliverableActivities() == 1) {
                this.PendingNavigationRequest = this.GetReturnToLmsNavigationRequest("exit_all");
            } else {
                this.PendingNavigationRequest = this.GetReturnToLmsNavigationRequest("suspend_all");
            }
            this.ScoUnloaded("SignalTerminated()");
            if (!this.ExitScormPlayerCalled) {
                this.ExitScormPlayer("SignalTerminated()");
            }
        } else {
            this.SignalTerminatedPending = true;
        }
    }
}

function Controller_GetPreferredReturnToLmsAction() {
    var _c2 = "";
    if (this.Package.Properties.ReturnToLmsAction == "selectable") {
        if (confirm("Exiting Course.  Click 'OK' To save state and pick up where you left off or choose 'Cancel' to finish the Course.")) {
            _c2 = "suspend_all";
        } else {
            _c2 = "exit_all";
        }
    } else {
        if (this.Package.Properties.ReturnToLmsAction == "legacy") {
            if (this.Activities.GetNumDeliverableActivities() == 1) {
                _c2 = "exit_all";
            } else {
                _c2 = "suspend_all";
            }
        } else {
            _c2 = this.Package.Properties.ReturnToLmsAction;
        }
    }
    return _c2;
}

function Controller_TranslateRunTimeNavRequest(_c3) {
    if (_c3.substring(0, 1) == "{") {
        var _c4 = this.ParseTargetStringFromChoiceRequest(_c3);
        if (_c3.substr(_c3.indexOf("}") + 1) == "choice") {
            return new NavigationRequest(NAVIGATION_REQUEST_CHOICE, _c4, "");
        } else {
            if (_c3.substr(_c3.indexOf("}") + 1) == "jump") {
                return new NavigationRequest(NAVIGATION_REQUEST_JUMP, _c4, "");
            }
        }
    }
    switch (_c3) {
        case SCORM_RUNTIME_NAV_REQUEST_CONTINUE:
            return new NavigationRequest(NAVIGATION_REQUEST_CONTINUE, null, "");
        case SCORM_RUNTIME_NAV_REQUEST_PREVIOUS:
            return new NavigationRequest(NAVIGATION_REQUEST_PREVIOUS, null, "");
        case SCORM_RUNTIME_NAV_REQUEST_EXIT:
            return new NavigationRequest(NAVIGATION_REQUEST_EXIT, null, "");
        case SCORM_RUNTIME_NAV_REQUEST_EXITALL:
            return new NavigationRequest(NAVIGATION_REQUEST_EXIT_ALL, null, "");
        case SCORM_RUNTIME_NAV_REQUEST_ABANDON:
            return new NavigationRequest(NAVIGATION_REQUEST_ABANDON, null, "");
        case SCORM_RUNTIME_NAV_REQUEST_ABANDONALL:
            return new NavigationRequest(NAVIGATION_REQUEST_ABANDON_ALL, null, "");
        case SCORM_RUNTIME_NAV_REQUEST_SUSPENDALL:
            return new NavigationRequest(NAVIGATION_REQUEST_SUSPEND_ALL, null, "");
        case SCORM_RUNTIME_NAV_REQUEST_NONE:
            return null;
        default:
            Debug.AssertError("Unrecognized runtime navigation request");
            break;
    }
    return null;
}

function Controller_FindPossibleNavRequestForRuntimeNavRequest(_c5) {
    if (_c5.substring(0, 1) == "{") {
        var _c6 = this.ParseTargetStringFromChoiceRequest(_c5);
        if (_c5.substr(_c5.indexOf("}") + 1) == "choice") {
            var _c7 = POSSIBLE_NAVIGATION_REQUEST_INDEX_CHOICE;
            for (var i = _c7; i < this.PossibleNavigationRequests.length; i++) {
                if (this.PossibleNavigationRequests[i].TargetActivityItemIdentifier == _c6) {
                    return this.PossibleNavigationRequests[i];
                }
            }
        } else {
            if (_c5.substr(_c5.indexOf("}") + 1) == "jump") {
                var _c9 = new NavigationRequest(NAVIGATION_REQUEST_JUMP, _c6, "");
                _c9.WillSucceed = this.IsJumpRequestValid(_c5);
                return _c9;
            }
        }
    }
    switch (_c5) {
        case SCORM_RUNTIME_NAV_REQUEST_CONTINUE:
            return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_CONTINUE];
        case SCORM_RUNTIME_NAV_REQUEST_PREVIOUS:
            return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_PREVIOUS];
        case SCORM_RUNTIME_NAV_REQUEST_EXIT:
            return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT];
        case SCORM_RUNTIME_NAV_REQUEST_EXITALL:
            return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT_ALL];
        case SCORM_RUNTIME_NAV_REQUEST_ABANDON:
            return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON];
        case SCORM_RUNTIME_NAV_REQUEST_ABANDONALL:
            return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON_ALL];
        case SCORM_RUNTIME_NAV_REQUEST_SUSPENDALL:
            return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_SUSPEND_ALL];
        case SCORM_RUNTIME_NAV_REQUEST_NONE:
            return null;
        default:
            Debug.AssertError("Unrecognized runtime navigation request");
            break;
    }
    return null;
}

function Controller_GetMessageText() {
    var msg = "";
    try {
        if (this.Sequencer.NavigationRequest !== null && this.Sequencer.NavigationRequest !== undefined) {
            if (this.Sequencer.NavigationRequest.MessageToUser !== null && this.Sequencer.NavigationRequest.MessageToUser !== undefined) {
                msg = this.Sequencer.NavigationRequest.MessageToUser;
            }
        }
    } catch (e) {}
    return msg;
}

function Controller_ClearPendingNavigationRequest() {
    this.WriteAuditLog("`1286`");
    this.PendingNavigationRequest = null;
}

function Controller_IsThereAPendingNavigationRequest() {
    return (this.PendingNavigationRequest !== null);
}

function Controller_DeliverActivity(_cb) {
    this.WriteAuditLog("`1262`");
    this.WriteAuditLog("`1551`" + _cb);
    this.WriteAuditLog("`1262`");
    var _cc = this.WriteAuditLog("`1487`" + _cb);
    if (_cb.IsDeliverable() === false) {
        Debug.AssertError("ERROR - Asked to deliver a non-leaf activity - " + _cb);
    }
    if ((Control.Package.Properties.ScoLaunchType !== LAUNCH_TYPE_POPUP_AFTER_CLICK) && (Control.Package.Properties.ScoLaunchType !== LAUNCH_TYPE_POPUP_AFTER_CLICK_WITHOUT_BROWSER_TOOLBAR)) {
        this.Api.ResetState();
        this.Api.InitializeForDelivery(_cb);
    }
    this.ScoLoader.LoadSco(_cb);
    this.UpdateDisplay(false, false);
    this.WriteDetailedLog("`1379`", _cc);
}

function Controller_PerformDelayedDeliveryInitialization(_cd) {
    this.Sequencer.ContentDeliveryEnvironmentActivityDataSubProcess(_cd);
    this.Api.ResetState();
    this.Api.InitializeForDelivery(_cd);
    this.EvaluatePossibleNavigationRequests();
}

function Controller_InitializePossibleNavigationRequests() {
    var _ce = this.WriteAuditLog("`1218`");
    var _cf;
    if (Control.Package.Properties.LookaheadSequencerMode === LOOKAHEAD_SEQUENCER_MODE_DISABLE) {
        this.WriteDetailedLog("`1358`", _ce);
        _cf = true;
    } else {
        this.WriteDetailedLog("`1380`", _ce);
        _cf = RESULT_UNKNOWN;
    }
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_START] = new PossibleRequest(NAVIGATION_REQUEST_START, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_RESUME_ALL] = new PossibleRequest(NAVIGATION_REQUEST_RESUME_ALL, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_CONTINUE] = new PossibleRequest(NAVIGATION_REQUEST_CONTINUE, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_PREVIOUS] = new PossibleRequest(NAVIGATION_REQUEST_PREVIOUS, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT] = new PossibleRequest(NAVIGATION_REQUEST_EXIT, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_EXIT_ALL] = new PossibleRequest(NAVIGATION_REQUEST_EXIT_ALL, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_SUSPEND_ALL] = new PossibleRequest(NAVIGATION_REQUEST_SUSPEND_ALL, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON] = new PossibleRequest(NAVIGATION_REQUEST_ABANDON, null, _cf, "", "");
    this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_ABANDON_ALL] = new PossibleRequest(NAVIGATION_REQUEST_ABANDON_ALL, null, _cf, "", "");
    var _d0 = POSSIBLE_NAVIGATION_REQUEST_INDEX_CHOICE;
    for (var _d1 in this.Activities.SortedActivityList) {
        activity = this.Activities.SortedActivityList[_d1];
        itemId = activity.GetItemIdentifier();
        this.PossibleNavigationRequests[_d0] = new PossibleRequest(NAVIGATION_REQUEST_CHOICE, itemId, _cf, "", "");
        _d0++;
    }
    for (var id in this.PossibleNavigationRequests) {
        this.WriteDetailedLog("`1737`" + this.PossibleNavigationRequests[id].toString(), _ce);
    }
    this.Sequencer.InitializePossibleNavigationRequestAbsolutes(this.PossibleNavigationRequests, this.Activities.ActivityTree, this.Activities.SortedActivityList);
}

function Controller_EvaluatePossibleNavigationRequests(_d3, _d4) {
    if (_d4 === undefined || _d4 === null) {
        _d4 = false;
    }
    if (this.Package.Properties.LookaheadSequencerMode !== LOOKAHEAD_SEQUENCER_MODE_DISABLE) {
        var _d5 = this.WriteAuditLog("`1117`");
        this.WriteDetailedLog("`1579`", _d5);
        this.TearDownSequencer(this.LookAheadSequencer);
        this.WriteDetailedLog("`1667`", _d5);
        this.LookAheadSequencer = this.CloneSequencer(this.Sequencer);
        this.LookAheadSequencer.LookAhead = true;
        this.WriteDetailedLog("`1080`", _d5);
        this.LookAheadSequencer.Activities.SetSequencer(this.LookAheadSequencer, true);
        this.WriteDetailedLog("`1165`", _d5);
        this.PossibleNavigationRequests = this.LookAheadSequencer.EvaluatePossibleNavigationRequests(this.PossibleNavigationRequests);
        this.WriteDetailedLog("`1133`", _d5);
        if (_d4 === true) {
            if (this.PendingNavigationRequest === null) {
                if ((this.Api !== null) && (this.Api.RunTimeData != null) && (this.Api.RunTimeData.NavRequest != SCORM_RUNTIME_NAV_REQUEST_NONE)) {
                    var _d6 = Control.FindPossibleNavRequestForRuntimeNavRequest(this.Api.RunTimeData.NavRequest);
                    this.WriteDetailedLog("`1298`" + _d6 + "`745`", _d5);
                    if (_d6.WillSucceed === true) {
                        this.WriteDetailedLog("`1239`", _d5);
                        Control.ScoHasTerminatedSoUnload();
                    } else {
                        this.WriteDetailedLog("`1040`", _d5);
                    }
                }
            }
        }
        if (_d3 !== undefined && _d3 !== null && _d3 == true) {
            this.UpdateDisplay(true, true);
        } else {
            this.UpdateDisplay(true, false);
        }
    } else {
        _d5 = this.WriteAuditLog("`533`");
    }
    this.Api.IsLookAheadSequencerRunning = false;
    this.Api.RunLookAheadSequencerIfNeeded();
}

function Controller_FindPossibleChoiceRequestForActivity(_d7) {
    var _d8 = _d7.GetItemIdentifier();
    var _d9 = POSSIBLE_NAVIGATION_REQUEST_INDEX_CHOICE;
    for (var i = _d9; i < this.PossibleNavigationRequests.length; i++) {
        if (this.PossibleNavigationRequests[i].TargetActivityItemIdentifier == _d8) {
            return this.PossibleNavigationRequests[i];
        }
    }
    Debug.AssertError("Could not locate possible choice request for activity-" + _d7);
    return null;
}

function Controller_GetPossibleContinueRequest() {
    return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_CONTINUE];
}

function Controller_GetPossiblePreviousRequest() {
    return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_PREVIOUS];
}

function Controller_IsTargetValid(_db) {
    var _dc = this.ParseTargetStringIntoActivity(_db);
    if (_dc === null) {
        return false;
    } else {
        return true;
    }
}

function Controller_IsChoiceRequestValid(_dd) {
    var _de = this.ParseTargetStringIntoActivity(_dd);
    var _df = _de.GetItemIdentifier();
    for (var i = POSSIBLE_NAVIGATION_REQUEST_INDEX_CHOICE; i < this.PossibleNavigationRequests.length; i++) {
        if (this.PossibleNavigationRequests[i].TargetActivityItemIdentifier == _df) {
            return this.PossibleNavigationRequests[i].WillSucceed;
        }
    }
    return false;
}

function Controller_IsJumpRequestValid(_e1) {
    var _e2 = this.ParseTargetStringIntoActivity(_e1);
    if (_e2 != null) {
        return _e2.IsAvailable();
    }
    return false;
}

function Controller_IsContinueRequestValid() {
    return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_CONTINUE].WillSucceed;
}

function Controller_IsPreviousRequestValid() {
    return this.PossibleNavigationRequests[POSSIBLE_NAVIGATION_REQUEST_INDEX_PREVIOUS].WillSucceed;
}

function Controller_ParseTargetStringIntoActivity(_e3) {
    var _e4 = this.ParseTargetStringFromChoiceRequest(_e3);
    var _e5 = this.Activities.GetActivityFromIdentifier(_e4);
    return _e5;
}

function Controller_ParseTargetStringFromChoiceRequest(_e6) {
    return _e6.substring(_e6.indexOf("=") + 1, _e6.indexOf("}"));
}

function Controller_CloneSequencer(_e7, _e8) {
    var _e9 = new Sequencer(_e8, _e7.Activities.Clone());
    if (_e7.SuspendedActivity === null) {
        _e9.SuspendedActivity = null;
    } else {
        _e9.SuspendedActivity = _e9.Activities.GetActivityFromIdentifier(_e7.SuspendedActivity.GetItemIdentifier());
    }
    if (_e7.CurrentActivity === null) {
        _e9.CurrentActivity = null;
    } else {
        _e9.CurrentActivity = _e9.Activities.GetActivityFromIdentifier(_e7.CurrentActivity.GetItemIdentifier());
    }
    _e9.GlobalObjectives = new Array();
    for (var _ea in _e7.GlobalObjectives) {
        _e9.GlobalObjectives[_e9.GlobalObjectives.length] = _e7.GlobalObjectives[_ea].Clone();
    }
    if (_e7.AtEndOfCourse !== undefined) {
        _e9.AtEndOfCourse = _e7.AtEndOfCourse;
        _e9.AtStartOfCourse = _e7.AtStartOfCourse;
    }
    _e9.NavigationRequest = null;
    _e9.ChoiceTargetIdentifier = null;
    _e9.Exception = null;
    _e9.ExceptionText = null;
    return _e9;
}

function Controller_TearDownSequencer(_eb) {
    _eb.LookAhead = null;
    if (_eb.Activities !== null) {
        _eb.Activities.TearDown();
    }
    _eb.Activities = null;
    _eb.NavigationRequest = null;
    _eb.ChoiceTargetIdentifier = null;
    _eb.SuspendedActivity = null;
    _eb.CurrentActivity = null;
    _eb.Exception = null;
    _eb.ExceptionText = null;
    _eb.GlobalObjectives = null;
}

function Controller_WriteAuditLog(str) {
    Debug.WriteControlAudit(str);
}

function Controller_WriteDetailedLog(str, _ee) {
    Debug.WriteControlDetailed(str, _ee);
}

function Controller_WriteDetailedLogError(str, _f0) {
    Debug.WriteControlDetailed(str, _f0, true);
}

function Controller_WriteHistoryLog(str, _f2) {
    HistoryLog.WriteEventDetailed(str, _f2);
}

function Controller_WriteHistoryReturnValue(str, _f4) {
    HistoryLog.WriteEventDetailedReturnValue(str, _f4);
}

function Controller_GetLaunchHistoryId() {
    return LaunchHistoryId;
}

function BuildFullUrl(_f5, _f6) {
    var _f7;
    if (_f6.indexOf("?") > -1) {
        _f7 = _f6.substr(0, _f6.indexOf("?"));
    } else {
        _f7 = _f6;
    }
    var _f8 = _f6.substr(0, _f7.lastIndexOf("/"));
    while (_f5.indexOf("../") > -1) {
        _f5 = _f5.substr(3, _f5.length);
        _f8 = _f8.substr(0, _f8.lastIndexOf("/"));
    }
    return _f8 + "/" + _f5;
}

function GetController() {
    var _f9 = 500;
    var _fa = 0;
    var win = window;
    var _fc;
    while ((win.Control === null) && (win.parent !== null) && (win.parent != win) && (_fa <= _f9)) {
        _fa++;
        win = win.parent;
    }
    if (win.Control === null) {
        Debug.AssertError("Could not locate the Control object.");
    } else {
        _fc = win.Control;
    }
    return _fc;
}

function Controller_UpdateGlobalLearnerPrefs() {
    if (this.Api.LearnerPrefsArray !== null && this.Api.LearnerPrefsArray !== undefined) {
        var _fd = this.Api.LearnerPrefsArray;
        for (var _fe in _fd) {
            for (var _ff in this.Activities.ActivityList) {
                var _100 = this.Activities.ActivityList[_ff];
                if (_100.RunTime !== null && _100.RunTime[_fe] !== _fd[_fe]) {
                    _100.RunTime[_fe] = _fd[_fe];
                    _100.RunTime.SetDirtyData();
                }
            }
        }
    }
}

function Controller_IsUserOverTimeLimit() {
    if (this.Package.Properties.TimeLimit <= 0) {
        return false;
    }
    var _101 = this.Activities.GetRootActivity();
    if (_101 === null) {
        return false;
    }
    var _102 = ConvertIso8601TimeSpanToHundredths(_101.GetActivityExperiencedDurationTracked());
    var _103;
    if (this.Api.TrackedStartDate === null) {
        _103 = 0;
    } else {
        _103 = Math.round((new Date() - this.Api.TrackedStartDate) / 10);
    }
    var _104 = _102 + _103;
    var _105 = this.Package.Properties.TimeLimit * 60 * 100;
    return _104 > _105;
}

function Controller_ExitIfTimeLimitExceeded() {
    if (this.IsUserOverTimeLimit() == true) {
        this.WriteAuditLog("`846`");
        if (this.MessageShown !== true) {
            alert("You have exceeded the time limit for this course, your session will now end.");
            this.MessageShown = true;
        }
        this.TriggerReturnToLMS();
    }
}

function Controller_BlockCourseEntryWithMessage(_106) {
    this.Sequencer.NavigationRequest = new NavigationRequest(NAVIGATION_REQUEST_DISPLAY_MESSAGE, null, _106);
    for (var _107 in this.Sequencer.Activities.ActivityList) {
        activity.SetHiddenFromChoice(true);
        var _108 = this.Sequencer.Activities.ActivityList[_107].MenuItem;
        if (_108 !== null) {
            _108.Disable();
        }
    }
    for (var i = 0; i < this.PossibleNavigationRequests.length; i++) {
        this.PossibleNavigationRequests[i].WillSucceed = false;
    }
    IntegrationImplementation.UpdateControlState(IntegrationImplementation.GetDocumentObjectForControls(), this.PossibleNavigationRequests, null);
}

function Debugger(_10a, _10b, _10c, _10d, _10e, _10f, _110, _111, _112, _113, _114) {
    this.auditCount = 0;
    this.RecordControlAudit = _10a;
    this.RecordControlDetailed = _10b;
    if (this.RecordControlDetailed) {
        this.RecordControlAudit = true;
    }
    this.RecordRteAudit = _10c;
    this.RecordRteDetailed = _10d;
    if (this.RecordRteDetailed) {
        this.RecordRteAudit = true;
    }
    this.RecordSequencingAudit = _10e;
    this.RecordSequencingDetailed = _10f;
    if (this.RecordSequencingDetailed) {
        this.RecordSequencingAudit = true;
    }
    this.RecordLookAheadAudit = _111;
    this.RecordLookAheadDetailed = _112;
    if (this.RecordLookAheadDetailed) {
        this.RecordLookAheadAudit = true;
    }
    this.RecordSequencingSimple = _110;
    this.Write = Debugger_Write;
    this.AssertError = Debugger_AssertError;
    this.DataIsAvailable = Debugger_DataIsAvailable;
    this.ShowAllAvailableData = Debugger_ShowAllAvailableData;
    this.WriteControlAudit = Debugger_WriteControlAudit;
    this.WriteControlDetailed = Debugger_WriteControlDetailed;
    this.WriteRteAudit = Debugger_WriteRteAudit;
    this.WriteRteAuditReturnValue = Debugger_WriteRteAuditReturnValue;
    this.WriteRteDetailed = Debugger_WriteRteDetailed;
    this.WriteSequencingAudit = Debugger_WriteSequencingAudit;
    this.WriteSequencingAuditReturnValue = Debugger_WriteSequencingAuditReturnValue;
    this.WriteSequencingDetailed = Debugger_WriteSequencingDetailed;
    this.WriteSequencingSimpleAudit = Debugger_WriteSequencingSimpleAudit;
    this.WriteSequencingSimpleReturnValue = Debugger_WriteSequencingSimpleReturnValue;
    this.WriteSequencingSimpleDetailed = Debugger_WriteSequencingSimpleDetailed;
    this.WriteLookAheadAudit = Debugger_WriteLookAheadAudit;
    this.WriteLookAheadAuditReturnValue = Debugger_WriteLookAheadAuditReturnValue;
    this.WriteLookAheadDetailed = Debugger_WriteLookAheadDetailed;
    this.GetErrors = Debugger_GetErrors;
    this.log = new Log(_113, _114);
    this.currentControlEntry = null;
    this.currentRunTimeEntry = null;
    this.currentSequencingEntry = null;
    this.currentLookAheadEntry = null;
    this.currentSequencingSimpleEntry = null;
    this.ErrorDataExists = false;
    this.ShowDebugLogAtExit = false;
    this.version = _113;
    this.includeTimestamps = _114;
}

function Debugger_Write(str) {
    this.AssertError("Debug.Write function is deprecated. Remove all calls.");
}

function Debugger_AssertError(arg, _117) {
    if (_117 === undefined || _117 === null || _117 === true) {
        var _118 = "Code Asserted Error-" + arg;
        Debug.WriteControlAudit(_118);
        if (typeof console !== "undefined") {
            console.log(_118);
        }
    }
}

function Debugger_DataIsAvailable() {
    var _119 = this.RecordControlAudit || this.RecordControlDetailed || this.RecordRteAudit || this.RecordRteDetailed || this.RecordSequencingAudit || this.RecordSequencingDetailed || this.RecordLookAheadAudit || this.RecordLookAheadDetailed || this.ErrorDataExists;
    return _119;
}

function Debugger_ShowAllAvailableData(_11a) {
    if (_11a === undefined || _11a === null) {
        _11a = false;
    }
    this.log.display(_11a);
}

function Debugger_WriteControlAudit(args, _11c, _11d) {
    if (_11d) {
        this.ErrorDataExists = true;
    }
    if (this.RecordControlAudit || _11d) {
        if (_11c === undefined || _11c === null) {
            this.currentControlEntry = this.log.startNew("c", args);
        } else {
            this.currentControlEntry = _11c.startNew("c", args);
        }
        this.currentControlEntry.setAttribute("id", this.auditCount++);
        return this.currentControlEntry;
    } else {
        return disabledLogEntry;
    }
}

function Debugger_WriteControlAuditReturnValue(str, _11f, _120) {
    if (this.currentControlEntry == null) {
        return;
    }
    if (this.RecordControlAudit || _120) {
        this.currentControlEntry.setReturn(str);
    }
    if (_11f !== null && _11f !== undefined) {
        this.currentControlEntry = _11f;
    } else {
        this.AssertError("Debugger_WriteControlAuditReturnValue() called without parentEntry");
    }
}

function Debugger_WriteControlDetailed(str, _122, _123) {
    if (this.currentControlEntry == null) {
        return;
    }
    if (_123) {
        var _124 = this.WriteControlAudit("Control ERROR", null, true);
        _124.write(str);
    } else {
        if (this.RecordControlDetailed) {
            if (_122 !== undefined && _122 !== null) {
                _122.write(str);
            } else {
                this.currentControlEntry.write(str);
            }
        }
    }
}

function Debugger_WriteRteAudit(args, _126) {
    if (this.RecordRteAudit) {
        if (_126 === undefined || _126 === null) {
            this.currentRunTimeEntry = this.log.startNew("rt", args);
        } else {
            this.currentRunTimeEntry = _126.startNew("rt", args);
        }
        this.currentRunTimeEntry.setAttribute("id", this.auditCount++);
        return this.currentRunTimeEntry;
    } else {
        return disabledLogEntry;
    }
}

function Debugger_WriteRteAuditReturnValue(str, _128) {
    if (this.currentRunTimeEntry == null) {
        return;
    }
    if (this.RecordRteAudit) {
        this.currentRunTimeEntry.setReturn(str);
    }
    if (_128 !== null && _128 !== undefined) {
        this.currentRunTimeEntry = _128;
    } else {}
}

function Debugger_WriteRteDetailed(str, _12a) {
    if (this.currentRunTimeEntry == null) {
        return;
    }
    if (this.RecordRteDetailed) {
        if (_12a === undefined || _12a === null) {
            this.currentRunTimeEntry.write(str);
        } else {
            _12a.write(str);
        }
    }
}

function Debugger_WriteSequencingAudit(args, _12c) {
    if (this.RecordSequencingAudit) {
        if (_12c === undefined || _12c === null) {
            this.currentSequencingEntry = this.log.startNew("s", args);
        } else {
            this.currentSequencingEntry = _12c.startNew("s", args);
        }
        this.currentSequencingEntry.setAttribute("id", this.auditCount++);
        return this.currentSequencingEntry;
    } else {
        return disabledLogEntry;
    }
}

function Debugger_WriteSequencingAuditReturnValue(str, _12e) {
    if (this.currentSequencingEntry == null) {
        return;
    }
    if (this.RecordSequencingAudit) {
        this.currentSequencingEntry.setReturn(str);
    }
    if (_12e !== null && _12e !== undefined) {
        this.currentSequencingEntry = _12e;
    } else {
        this.AssertError("Debugger_WriteSequencingAuditReturnValue() called without parentEntry");
    }
}

function Debugger_WriteSequencingDetailed(str, _130) {
    if (this.currentSequencingEntry == null) {
        return;
    }
    if (this.RecordSequencingDetailed) {
        if (_130 === undefined || _130 === null) {
            this.currentSequencingEntry.write(str);
        } else {
            _130.write(str);
        }
    }
}

function Debugger_WriteLookAheadAudit(args, _132) {
    if (this.RecordLookAheadAudit) {
        if (_132 === undefined || _132 === null) {
            this.currentLookAheadEntry = this.log.startNew("l", args);
        } else {
            this.currentLookAheadEntry = _132.startNew("l", args);
        }
        this.currentLookAheadEntry.setAttribute("id", this.auditCount++);
        return this.currentLookAheadEntry;
    } else {
        return disabledLogEntry;
    }
}

function Debugger_WriteLookAheadAuditReturnValue(str, _134) {
    if (this.currentLookAheadEntry == null) {
        return;
    }
    if (this.RecordLookAheadAudit) {
        this.currentLookAheadEntry.setReturn(str);
    }
    if (_134 !== null && _134 !== undefined) {
        this.currentLookAheadEntry = _134;
    } else {
        this.AssertError("Debugger_WriteLookAheadAuditReturnValue() called without parentEntry");
    }
}

function Debugger_WriteLookAheadDetailed(str, _136) {
    if (this.currentLookAheadEntry == null) {
        return;
    }
    if (this.RecordLookAheadDetailed) {
        if (_136 === undefined || _136 === null) {
            this.currentLookAheadEntry.write(str);
        } else {
            _136.write(str);
        }
    }
}

function Debugger_WriteSequencingSimpleAudit(args, _138) {
    if (this.RecordSequencingSimple) {
        if (_138 === undefined || _138 === null) {
            this.currentSequencingSimpleEntry = this.log.startNew("ss", args);
        } else {
            this.currentSequencingSimpleEntry = _138.startNew("ss", args);
        }
        this.currentSequencingSimpleEntry.setAttribute("id", this.auditCount++);
        return this.currentSequencingSimpleEntry;
    } else {
        return disabledLogEntry;
    }
}

function Debugger_WriteSequencingSimpleReturnValue(str, _13a) {
    if (this.currentSequencingSimpleEntry == null) {
        return;
    }
    if (this.RecordSequencingSimple) {
        this.currentSequencingSimpleEntry.setReturn(str);
    }
    if (_13a !== null && _13a !== undefined) {
        this.currentSequencingSimpleEntry = _13a;
    } else {
        this.AssertError("Debugger_WriteLookAheadAuditReturnValue() called without parentEntry");
    }
}

function Debugger_WriteSequencingSimpleDetailed(str, _13c) {
    if (this.currentSequencingSimpleEntry == null) {
        return;
    }
    if (this.RecordSequencingSimple) {
        if (_13c === undefined || _13c === null) {
            this.currentSequencingSimpleEntry.write(str);
        } else {
            _13c.write(str);
        }
    }
}

function Debugger_GetErrors() {
    var _13d = "//c[@f='Control ERROR']";
    var _13e = this.log.dom.selectNodes(_13d);
    var _13f = new Array();
    for (var i = 0; i < _13e.length; i++) {
        if (_13e[i].text !== undefined) {
            _13f[_13f.length] = _13e[i].text;
        } else {
            _13f[_13f.length] = _13e[i].textContent;
        }
    }
    return _13f;
}

function DisabledLogEntry() {}
DisabledLogEntry.prototype.write = function() {};
DisabledLogEntry.prototype.error = function() {};
DisabledLogEntry.prototype.startNew = function() {
    return disabledLogEntry;
};
DisabledLogEntry.prototype.setAttribute = function() {};
DisabledLogEntry.prototype.setReturn = function() {};
disabledLogEntry = new DisabledLogEntry();
var objXmlHttp = null;
var Debug = null;
var ExternalConfig = "";
var ExternalRegistrationId = "";
var PathToCourse = "";
var RedirectOnExitUrl = "";
var LearnerName = "";
var LearnerId = "";
var IntermediatePage = null;
var PopupLauncherPage = null;
var RegistrationToDeliver = null;
var QueryStringAdditions = null;
var IntegrationImplementation = null;
var Control = null;

function HistoryLogger(_141, _142, _143) {
    this.auditCount = 0;
    this.RecordHistory = _141;
    this.RecordHistoryDetailed = _142;
    if (this.RecordHistoryDetailed) {
        this.RecordHistory = true;
    }
    this.DataIsAvailable = HistoryLogger_DataIsAvailable;
    this.ShowAllAvailableData = HistoryLogger_ShowAllAvailableData;
    this.WriteEvent = HistoryLogger_WriteEvent;
    this.WriteEventReturnValue = HistoryLogger_WriteEventReturnValue;
    this.WriteEventDetailed = HistoryLogger_WriteEventDetailed;
    this.WriteEventDetailedReturnValue = HistoryLogger_WriteEventDetailedReturnValue;
    this.GetSerializedLog = HistoryLogger_GetSerializedLog;
    this.log = new Log(_143, true, "RTL");
    this.currentEntry = null;
    this.DataExists = false;
    this.version = _143;
    this.includeTimestamps = true;
}

function HistoryLogger_DataIsAvailable() {
    return this.DataExists;
}

function HistoryLogger_ShowAllAvailableData() {
    this.log.display();
}

function HistoryLogger_WriteEvent(args, atts, _146) {
    if (this.RecordHistory) {
        var _147 = (atts !== undefined && atts !== null && atts.event ? "" : args);
        if (_146 === undefined || _146 === null) {
            this.currentEntry = this.log.startNew("RT", _147);
        } else {
            this.currentEntry = _146.startNew("RT", _147);
        }
        this.currentEntry.setAttribute("id", this.auditCount++);
        for (var _148 in atts) {
            this.currentEntry.setAttribute(_148, atts[_148]);
        }
        return this.currentEntry;
    } else {
        return disabledLogEntry;
    }
}

function HistoryLogger_WriteEventReturnValue(str, atts, _14b) {
    if (this.currentEntry == null) {
        return;
    }
    if (this.RecordHistory) {
        this.currentEntry.setReturn(str);
        for (var _14c in atts) {
            this.currentEntry.setAttribute(_14c, atts[_14c]);
        }
    }
    if (_14b !== null && _14b !== undefined) {
        this.currentEntry = _14b;
    } else {}
}

function HistoryLogger_WriteEventDetailed(args, atts, _14f) {
    if (this.RecordHistoryDetailed) {
        var _150 = (atts !== undefined && atts !== null && atts.event ? "" : args);
        if (_14f === undefined || _14f === null) {
            this.currentEntry = this.log.startNew("RT", _150);
        } else {
            this.currentEntry = _14f.startNew("RT", _150);
        }
        this.currentEntry.setAttribute("id", this.auditCount++);
        for (var _151 in atts) {
            this.currentEntry.setAttribute(_151, atts[_151]);
        }
        return this.currentEntry;
    } else {
        return disabledLogEntry;
    }
}

function HistoryLogger_WriteEventDetailedReturnValue(str, atts, _154) {
    if (this.currentEntry == null) {
        return;
    }
    if (this.RecordHistoryDetailed) {
        this.currentEntry.setReturn(str);
        for (var _155 in atts) {
            this.currentEntry.setAttribute(_155, atts[_155]);
        }
    }
    if (_154 !== null && _154 !== undefined) {
        this.currentEntry = _154;
    } else {}
}

function HistoryLogger_GetSerializedLog() {
    if (Log.ClientLoggingIsFunctional !== true) {
        return "<RTL />";
    }
    return this.log.serializeDomElement(this.log.dom.getElementsByTagName("RTL")[0]);
}
Iso639LangCodes_LangCodes.prototype["aa"] = true;
Iso639LangCodes_LangCodes.prototype["aar"] = true;
Iso639LangCodes_LangCodes.prototype["ab"] = true;
Iso639LangCodes_LangCodes.prototype["abk"] = true;
Iso639LangCodes_LangCodes.prototype["ace"] = true;
Iso639LangCodes_LangCodes.prototype["ach"] = true;
Iso639LangCodes_LangCodes.prototype["ada"] = true;
Iso639LangCodes_LangCodes.prototype["ady"] = true;
Iso639LangCodes_LangCodes.prototype["ae"] = true;
Iso639LangCodes_LangCodes.prototype["af"] = true;
Iso639LangCodes_LangCodes.prototype["afa"] = true;
Iso639LangCodes_LangCodes.prototype["afh"] = true;
Iso639LangCodes_LangCodes.prototype["afr"] = true;
Iso639LangCodes_LangCodes.prototype["ak"] = true;
Iso639LangCodes_LangCodes.prototype["aka"] = true;
Iso639LangCodes_LangCodes.prototype["akk"] = true;
Iso639LangCodes_LangCodes.prototype["alb"] = true;
Iso639LangCodes_LangCodes.prototype["alb"] = true;
Iso639LangCodes_LangCodes.prototype["ale"] = true;
Iso639LangCodes_LangCodes.prototype["alg"] = true;
Iso639LangCodes_LangCodes.prototype["am"] = true;
Iso639LangCodes_LangCodes.prototype["amh"] = true;
Iso639LangCodes_LangCodes.prototype["an"] = true;
Iso639LangCodes_LangCodes.prototype["ang"] = true;
Iso639LangCodes_LangCodes.prototype["apa"] = true;
Iso639LangCodes_LangCodes.prototype["ar"] = true;
Iso639LangCodes_LangCodes.prototype["ara"] = true;
Iso639LangCodes_LangCodes.prototype["arc"] = true;
Iso639LangCodes_LangCodes.prototype["arg"] = true;
Iso639LangCodes_LangCodes.prototype["arm"] = true;
Iso639LangCodes_LangCodes.prototype["arm"] = true;
Iso639LangCodes_LangCodes.prototype["arn"] = true;
Iso639LangCodes_LangCodes.prototype["arp"] = true;
Iso639LangCodes_LangCodes.prototype["art"] = true;
Iso639LangCodes_LangCodes.prototype["arw"] = true;
Iso639LangCodes_LangCodes.prototype["as"] = true;
Iso639LangCodes_LangCodes.prototype["asm"] = true;
Iso639LangCodes_LangCodes.prototype["ast"] = true;
Iso639LangCodes_LangCodes.prototype["ath"] = true;
Iso639LangCodes_LangCodes.prototype["aus"] = true;
Iso639LangCodes_LangCodes.prototype["av"] = true;
Iso639LangCodes_LangCodes.prototype["ava"] = true;
Iso639LangCodes_LangCodes.prototype["ave"] = true;
Iso639LangCodes_LangCodes.prototype["awa"] = true;
Iso639LangCodes_LangCodes.prototype["ay"] = true;
Iso639LangCodes_LangCodes.prototype["aym"] = true;
Iso639LangCodes_LangCodes.prototype["az"] = true;
Iso639LangCodes_LangCodes.prototype["aze"] = true;
Iso639LangCodes_LangCodes.prototype["ba"] = true;
Iso639LangCodes_LangCodes.prototype["bad"] = true;
Iso639LangCodes_LangCodes.prototype["bai"] = true;
Iso639LangCodes_LangCodes.prototype["bak"] = true;
Iso639LangCodes_LangCodes.prototype["bal"] = true;
Iso639LangCodes_LangCodes.prototype["bam"] = true;
Iso639LangCodes_LangCodes.prototype["ban"] = true;
Iso639LangCodes_LangCodes.prototype["baq"] = true;
Iso639LangCodes_LangCodes.prototype["baq"] = true;
Iso639LangCodes_LangCodes.prototype["bas"] = true;
Iso639LangCodes_LangCodes.prototype["bat"] = true;
Iso639LangCodes_LangCodes.prototype["be"] = true;
Iso639LangCodes_LangCodes.prototype["bej"] = true;
Iso639LangCodes_LangCodes.prototype["bel"] = true;
Iso639LangCodes_LangCodes.prototype["bem"] = true;
Iso639LangCodes_LangCodes.prototype["ben"] = true;
Iso639LangCodes_LangCodes.prototype["ber"] = true;
Iso639LangCodes_LangCodes.prototype["bg"] = true;
Iso639LangCodes_LangCodes.prototype["bh"] = true;
Iso639LangCodes_LangCodes.prototype["bho"] = true;
Iso639LangCodes_LangCodes.prototype["bi"] = true;
Iso639LangCodes_LangCodes.prototype["bih"] = true;
Iso639LangCodes_LangCodes.prototype["bik"] = true;
Iso639LangCodes_LangCodes.prototype["bin"] = true;
Iso639LangCodes_LangCodes.prototype["bis"] = true;
Iso639LangCodes_LangCodes.prototype["bla"] = true;
Iso639LangCodes_LangCodes.prototype["bm"] = true;
Iso639LangCodes_LangCodes.prototype["bn"] = true;
Iso639LangCodes_LangCodes.prototype["bnt"] = true;
Iso639LangCodes_LangCodes.prototype["bo"] = true;
Iso639LangCodes_LangCodes.prototype["bo"] = true;
Iso639LangCodes_LangCodes.prototype["bod"] = true;
Iso639LangCodes_LangCodes.prototype["bod"] = true;
Iso639LangCodes_LangCodes.prototype["bos"] = true;
Iso639LangCodes_LangCodes.prototype["br"] = true;
Iso639LangCodes_LangCodes.prototype["bra"] = true;
Iso639LangCodes_LangCodes.prototype["bre"] = true;
Iso639LangCodes_LangCodes.prototype["bs"] = true;
Iso639LangCodes_LangCodes.prototype["btk"] = true;
Iso639LangCodes_LangCodes.prototype["bua"] = true;
Iso639LangCodes_LangCodes.prototype["bug"] = true;
Iso639LangCodes_LangCodes.prototype["bul"] = true;
Iso639LangCodes_LangCodes.prototype["bur"] = true;
Iso639LangCodes_LangCodes.prototype["bur"] = true;
Iso639LangCodes_LangCodes.prototype["byn"] = true;
Iso639LangCodes_LangCodes.prototype["ca"] = true;
Iso639LangCodes_LangCodes.prototype["cad"] = true;
Iso639LangCodes_LangCodes.prototype["cai"] = true;
Iso639LangCodes_LangCodes.prototype["car"] = true;
Iso639LangCodes_LangCodes.prototype["cat"] = true;
Iso639LangCodes_LangCodes.prototype["cau"] = true;
Iso639LangCodes_LangCodes.prototype["ce"] = true;
Iso639LangCodes_LangCodes.prototype["ceb"] = true;
Iso639LangCodes_LangCodes.prototype["cel"] = true;
Iso639LangCodes_LangCodes.prototype["ces"] = true;
Iso639LangCodes_LangCodes.prototype["ces"] = true;
Iso639LangCodes_LangCodes.prototype["ch"] = true;
Iso639LangCodes_LangCodes.prototype["cha"] = true;
Iso639LangCodes_LangCodes.prototype["chb"] = true;
Iso639LangCodes_LangCodes.prototype["che"] = true;
Iso639LangCodes_LangCodes.prototype["chg"] = true;
Iso639LangCodes_LangCodes.prototype["chi"] = true;
Iso639LangCodes_LangCodes.prototype["chi"] = true;
Iso639LangCodes_LangCodes.prototype["chk"] = true;
Iso639LangCodes_LangCodes.prototype["chm"] = true;
Iso639LangCodes_LangCodes.prototype["chn"] = true;
Iso639LangCodes_LangCodes.prototype["cho"] = true;
Iso639LangCodes_LangCodes.prototype["chp"] = true;
Iso639LangCodes_LangCodes.prototype["chr"] = true;
Iso639LangCodes_LangCodes.prototype["chu"] = true;
Iso639LangCodes_LangCodes.prototype["chv"] = true;
Iso639LangCodes_LangCodes.prototype["chy"] = true;
Iso639LangCodes_LangCodes.prototype["cmc"] = true;
Iso639LangCodes_LangCodes.prototype["co"] = true;
Iso639LangCodes_LangCodes.prototype["cop"] = true;
Iso639LangCodes_LangCodes.prototype["cor"] = true;
Iso639LangCodes_LangCodes.prototype["cos"] = true;
Iso639LangCodes_LangCodes.prototype["cpe"] = true;
Iso639LangCodes_LangCodes.prototype["cpf"] = true;
Iso639LangCodes_LangCodes.prototype["cpp"] = true;
Iso639LangCodes_LangCodes.prototype["cr"] = true;
Iso639LangCodes_LangCodes.prototype["cre"] = true;
Iso639LangCodes_LangCodes.prototype["crh"] = true;
Iso639LangCodes_LangCodes.prototype["crp"] = true;
Iso639LangCodes_LangCodes.prototype["cs"] = true;
Iso639LangCodes_LangCodes.prototype["cs"] = true;
Iso639LangCodes_LangCodes.prototype["csb"] = true;
Iso639LangCodes_LangCodes.prototype["cu"] = true;
Iso639LangCodes_LangCodes.prototype["cus"] = true;
Iso639LangCodes_LangCodes.prototype["cv"] = true;
Iso639LangCodes_LangCodes.prototype["cy"] = true;
Iso639LangCodes_LangCodes.prototype["cy"] = true;
Iso639LangCodes_LangCodes.prototype["cym"] = true;
Iso639LangCodes_LangCodes.prototype["cym"] = true;
Iso639LangCodes_LangCodes.prototype["cze"] = true;
Iso639LangCodes_LangCodes.prototype["cze"] = true;
Iso639LangCodes_LangCodes.prototype["da"] = true;
Iso639LangCodes_LangCodes.prototype["dak"] = true;
Iso639LangCodes_LangCodes.prototype["dan"] = true;
Iso639LangCodes_LangCodes.prototype["dar"] = true;
Iso639LangCodes_LangCodes.prototype["day"] = true;
Iso639LangCodes_LangCodes.prototype["de"] = true;
Iso639LangCodes_LangCodes.prototype["de"] = true;
Iso639LangCodes_LangCodes.prototype["del"] = true;
Iso639LangCodes_LangCodes.prototype["den"] = true;
Iso639LangCodes_LangCodes.prototype["deu"] = true;
Iso639LangCodes_LangCodes.prototype["deu"] = true;
Iso639LangCodes_LangCodes.prototype["dgr"] = true;
Iso639LangCodes_LangCodes.prototype["din"] = true;
Iso639LangCodes_LangCodes.prototype["div"] = true;
Iso639LangCodes_LangCodes.prototype["doi"] = true;
Iso639LangCodes_LangCodes.prototype["dra"] = true;
Iso639LangCodes_LangCodes.prototype["dsb"] = true;
Iso639LangCodes_LangCodes.prototype["dua"] = true;
Iso639LangCodes_LangCodes.prototype["dum"] = true;
Iso639LangCodes_LangCodes.prototype["dut"] = true;
Iso639LangCodes_LangCodes.prototype["dut"] = true;
Iso639LangCodes_LangCodes.prototype["dv"] = true;
Iso639LangCodes_LangCodes.prototype["dyu"] = true;
Iso639LangCodes_LangCodes.prototype["dz"] = true;
Iso639LangCodes_LangCodes.prototype["dzo"] = true;
Iso639LangCodes_LangCodes.prototype["ee"] = true;
Iso639LangCodes_LangCodes.prototype["efi"] = true;
Iso639LangCodes_LangCodes.prototype["egy"] = true;
Iso639LangCodes_LangCodes.prototype["eka"] = true;
Iso639LangCodes_LangCodes.prototype["el"] = true;
Iso639LangCodes_LangCodes.prototype["el"] = true;
Iso639LangCodes_LangCodes.prototype["ell"] = true;
Iso639LangCodes_LangCodes.prototype["ell"] = true;
Iso639LangCodes_LangCodes.prototype["elx"] = true;
Iso639LangCodes_LangCodes.prototype["en"] = true;
Iso639LangCodes_LangCodes.prototype["eng"] = true;
Iso639LangCodes_LangCodes.prototype["enm"] = true;
Iso639LangCodes_LangCodes.prototype["eo"] = true;
Iso639LangCodes_LangCodes.prototype["epo"] = true;
Iso639LangCodes_LangCodes.prototype["es"] = true;
Iso639LangCodes_LangCodes.prototype["est"] = true;
Iso639LangCodes_LangCodes.prototype["et"] = true;
Iso639LangCodes_LangCodes.prototype["eu"] = true;
Iso639LangCodes_LangCodes.prototype["eu"] = true;
Iso639LangCodes_LangCodes.prototype["eus"] = true;
Iso639LangCodes_LangCodes.prototype["eus"] = true;
Iso639LangCodes_LangCodes.prototype["ewe"] = true;
Iso639LangCodes_LangCodes.prototype["ewo"] = true;
Iso639LangCodes_LangCodes.prototype["fa"] = true;
Iso639LangCodes_LangCodes.prototype["fa"] = true;
Iso639LangCodes_LangCodes.prototype["fan"] = true;
Iso639LangCodes_LangCodes.prototype["fao"] = true;
Iso639LangCodes_LangCodes.prototype["fas"] = true;
Iso639LangCodes_LangCodes.prototype["fas"] = true;
Iso639LangCodes_LangCodes.prototype["fat"] = true;
Iso639LangCodes_LangCodes.prototype["ff"] = true;
Iso639LangCodes_LangCodes.prototype["fi"] = true;
Iso639LangCodes_LangCodes.prototype["fij"] = true;
Iso639LangCodes_LangCodes.prototype["fil"] = true;
Iso639LangCodes_LangCodes.prototype["fin"] = true;
Iso639LangCodes_LangCodes.prototype["fiu"] = true;
Iso639LangCodes_LangCodes.prototype["fj"] = true;
Iso639LangCodes_LangCodes.prototype["fo"] = true;
Iso639LangCodes_LangCodes.prototype["fon"] = true;
Iso639LangCodes_LangCodes.prototype["fr"] = true;
Iso639LangCodes_LangCodes.prototype["fra"] = true;
Iso639LangCodes_LangCodes.prototype["fre"] = true;
Iso639LangCodes_LangCodes.prototype["frm"] = true;
Iso639LangCodes_LangCodes.prototype["fro"] = true;
Iso639LangCodes_LangCodes.prototype["fry"] = true;
Iso639LangCodes_LangCodes.prototype["ful"] = true;
Iso639LangCodes_LangCodes.prototype["fur"] = true;
Iso639LangCodes_LangCodes.prototype["fy"] = true;
Iso639LangCodes_LangCodes.prototype["ga"] = true;
Iso639LangCodes_LangCodes.prototype["gaa"] = true;
Iso639LangCodes_LangCodes.prototype["gay"] = true;
Iso639LangCodes_LangCodes.prototype["gba"] = true;
Iso639LangCodes_LangCodes.prototype["gd"] = true;
Iso639LangCodes_LangCodes.prototype["gem"] = true;
Iso639LangCodes_LangCodes.prototype["geo"] = true;
Iso639LangCodes_LangCodes.prototype["geo"] = true;
Iso639LangCodes_LangCodes.prototype["ger"] = true;
Iso639LangCodes_LangCodes.prototype["ger"] = true;
Iso639LangCodes_LangCodes.prototype["gez"] = true;
Iso639LangCodes_LangCodes.prototype["gil"] = true;
Iso639LangCodes_LangCodes.prototype["gl"] = true;
Iso639LangCodes_LangCodes.prototype["gla"] = true;
Iso639LangCodes_LangCodes.prototype["gle"] = true;
Iso639LangCodes_LangCodes.prototype["glg"] = true;
Iso639LangCodes_LangCodes.prototype["glv"] = true;
Iso639LangCodes_LangCodes.prototype["gmh"] = true;
Iso639LangCodes_LangCodes.prototype["gn"] = true;
Iso639LangCodes_LangCodes.prototype["goh"] = true;
Iso639LangCodes_LangCodes.prototype["gon"] = true;
Iso639LangCodes_LangCodes.prototype["gor"] = true;
Iso639LangCodes_LangCodes.prototype["got"] = true;
Iso639LangCodes_LangCodes.prototype["grb"] = true;
Iso639LangCodes_LangCodes.prototype["grc"] = true;
Iso639LangCodes_LangCodes.prototype["gre"] = true;
Iso639LangCodes_LangCodes.prototype["gre"] = true;
Iso639LangCodes_LangCodes.prototype["grn"] = true;
Iso639LangCodes_LangCodes.prototype["gu"] = true;
Iso639LangCodes_LangCodes.prototype["guj"] = true;
Iso639LangCodes_LangCodes.prototype["gv"] = true;
Iso639LangCodes_LangCodes.prototype["gwi"] = true;
Iso639LangCodes_LangCodes.prototype["ha"] = true;
Iso639LangCodes_LangCodes.prototype["hai"] = true;
Iso639LangCodes_LangCodes.prototype["hat"] = true;
Iso639LangCodes_LangCodes.prototype["hau"] = true;
Iso639LangCodes_LangCodes.prototype["haw"] = true;
Iso639LangCodes_LangCodes.prototype["he"] = true;
Iso639LangCodes_LangCodes.prototype["heb"] = true;
Iso639LangCodes_LangCodes.prototype["her"] = true;
Iso639LangCodes_LangCodes.prototype["hi"] = true;
Iso639LangCodes_LangCodes.prototype["hil"] = true;
Iso639LangCodes_LangCodes.prototype["him"] = true;
Iso639LangCodes_LangCodes.prototype["hin"] = true;
Iso639LangCodes_LangCodes.prototype["hit"] = true;
Iso639LangCodes_LangCodes.prototype["hmn"] = true;
Iso639LangCodes_LangCodes.prototype["hmo"] = true;
Iso639LangCodes_LangCodes.prototype["ho"] = true;
Iso639LangCodes_LangCodes.prototype["hr"] = true;
Iso639LangCodes_LangCodes.prototype["hr"] = true;
Iso639LangCodes_LangCodes.prototype["hrv"] = true;
Iso639LangCodes_LangCodes.prototype["hrv"] = true;
Iso639LangCodes_LangCodes.prototype["hsb"] = true;
Iso639LangCodes_LangCodes.prototype["ht"] = true;
Iso639LangCodes_LangCodes.prototype["hu"] = true;
Iso639LangCodes_LangCodes.prototype["hun"] = true;
Iso639LangCodes_LangCodes.prototype["hup"] = true;
Iso639LangCodes_LangCodes.prototype["hy"] = true;
Iso639LangCodes_LangCodes.prototype["hy"] = true;
Iso639LangCodes_LangCodes.prototype["hye"] = true;
Iso639LangCodes_LangCodes.prototype["hye"] = true;
Iso639LangCodes_LangCodes.prototype["hz"] = true;
Iso639LangCodes_LangCodes.prototype["ia"] = true;
Iso639LangCodes_LangCodes.prototype["iba"] = true;
Iso639LangCodes_LangCodes.prototype["ibo"] = true;
Iso639LangCodes_LangCodes.prototype["ice"] = true;
Iso639LangCodes_LangCodes.prototype["ice"] = true;
Iso639LangCodes_LangCodes.prototype["id"] = true;
Iso639LangCodes_LangCodes.prototype["ido"] = true;
Iso639LangCodes_LangCodes.prototype["ie"] = true;
Iso639LangCodes_LangCodes.prototype["ig"] = true;
Iso639LangCodes_LangCodes.prototype["ii"] = true;
Iso639LangCodes_LangCodes.prototype["iii"] = true;
Iso639LangCodes_LangCodes.prototype["ijo"] = true;
Iso639LangCodes_LangCodes.prototype["ik"] = true;
Iso639LangCodes_LangCodes.prototype["iku"] = true;
Iso639LangCodes_LangCodes.prototype["ile"] = true;
Iso639LangCodes_LangCodes.prototype["ilo"] = true;
Iso639LangCodes_LangCodes.prototype["ina"] = true;
Iso639LangCodes_LangCodes.prototype["inc"] = true;
Iso639LangCodes_LangCodes.prototype["ind"] = true;
Iso639LangCodes_LangCodes.prototype["ine"] = true;
Iso639LangCodes_LangCodes.prototype["inh"] = true;
Iso639LangCodes_LangCodes.prototype["io"] = true;
Iso639LangCodes_LangCodes.prototype["ipk"] = true;
Iso639LangCodes_LangCodes.prototype["ira"] = true;
Iso639LangCodes_LangCodes.prototype["iro"] = true;
Iso639LangCodes_LangCodes.prototype["is"] = true;
Iso639LangCodes_LangCodes.prototype["is"] = true;
Iso639LangCodes_LangCodes.prototype["isl"] = true;
Iso639LangCodes_LangCodes.prototype["isl"] = true;
Iso639LangCodes_LangCodes.prototype["it"] = true;
Iso639LangCodes_LangCodes.prototype["ita"] = true;
Iso639LangCodes_LangCodes.prototype["iu"] = true;
Iso639LangCodes_LangCodes.prototype["ja"] = true;
Iso639LangCodes_LangCodes.prototype["jav"] = true;
Iso639LangCodes_LangCodes.prototype["jbo"] = true;
Iso639LangCodes_LangCodes.prototype["jpn"] = true;
Iso639LangCodes_LangCodes.prototype["jpr"] = true;
Iso639LangCodes_LangCodes.prototype["jrb"] = true;
Iso639LangCodes_LangCodes.prototype["jv"] = true;
Iso639LangCodes_LangCodes.prototype["ka"] = true;
Iso639LangCodes_LangCodes.prototype["ka"] = true;
Iso639LangCodes_LangCodes.prototype["kaa"] = true;
Iso639LangCodes_LangCodes.prototype["kab"] = true;
Iso639LangCodes_LangCodes.prototype["kac"] = true;
Iso639LangCodes_LangCodes.prototype["kal"] = true;
Iso639LangCodes_LangCodes.prototype["kam"] = true;
Iso639LangCodes_LangCodes.prototype["kan"] = true;
Iso639LangCodes_LangCodes.prototype["kar"] = true;
Iso639LangCodes_LangCodes.prototype["kas"] = true;
Iso639LangCodes_LangCodes.prototype["kat"] = true;
Iso639LangCodes_LangCodes.prototype["kat"] = true;
Iso639LangCodes_LangCodes.prototype["kau"] = true;
Iso639LangCodes_LangCodes.prototype["kaw"] = true;
Iso639LangCodes_LangCodes.prototype["kaz"] = true;
Iso639LangCodes_LangCodes.prototype["kbd"] = true;
Iso639LangCodes_LangCodes.prototype["kg"] = true;
Iso639LangCodes_LangCodes.prototype["kha"] = true;
Iso639LangCodes_LangCodes.prototype["khi"] = true;
Iso639LangCodes_LangCodes.prototype["khm"] = true;
Iso639LangCodes_LangCodes.prototype["kho"] = true;
Iso639LangCodes_LangCodes.prototype["ki"] = true;
Iso639LangCodes_LangCodes.prototype["kik"] = true;
Iso639LangCodes_LangCodes.prototype["kin"] = true;
Iso639LangCodes_LangCodes.prototype["kir"] = true;
Iso639LangCodes_LangCodes.prototype["kj"] = true;
Iso639LangCodes_LangCodes.prototype["kk"] = true;
Iso639LangCodes_LangCodes.prototype["kl"] = true;
Iso639LangCodes_LangCodes.prototype["km"] = true;
Iso639LangCodes_LangCodes.prototype["kmb"] = true;
Iso639LangCodes_LangCodes.prototype["kn"] = true;
Iso639LangCodes_LangCodes.prototype["ko"] = true;
Iso639LangCodes_LangCodes.prototype["kok"] = true;
Iso639LangCodes_LangCodes.prototype["kom"] = true;
Iso639LangCodes_LangCodes.prototype["kon"] = true;
Iso639LangCodes_LangCodes.prototype["kor"] = true;
Iso639LangCodes_LangCodes.prototype["kos"] = true;
Iso639LangCodes_LangCodes.prototype["kpe"] = true;
Iso639LangCodes_LangCodes.prototype["kr"] = true;
Iso639LangCodes_LangCodes.prototype["krc"] = true;
Iso639LangCodes_LangCodes.prototype["kro"] = true;
Iso639LangCodes_LangCodes.prototype["kru"] = true;
Iso639LangCodes_LangCodes.prototype["ks"] = true;
Iso639LangCodes_LangCodes.prototype["ku"] = true;
Iso639LangCodes_LangCodes.prototype["kua"] = true;
Iso639LangCodes_LangCodes.prototype["kum"] = true;
Iso639LangCodes_LangCodes.prototype["kur"] = true;
Iso639LangCodes_LangCodes.prototype["kut"] = true;
Iso639LangCodes_LangCodes.prototype["kv"] = true;
Iso639LangCodes_LangCodes.prototype["kw"] = true;
Iso639LangCodes_LangCodes.prototype["ky"] = true;
Iso639LangCodes_LangCodes.prototype["la"] = true;
Iso639LangCodes_LangCodes.prototype["lad"] = true;
Iso639LangCodes_LangCodes.prototype["lah"] = true;
Iso639LangCodes_LangCodes.prototype["lam"] = true;
Iso639LangCodes_LangCodes.prototype["lao"] = true;
Iso639LangCodes_LangCodes.prototype["lat"] = true;
Iso639LangCodes_LangCodes.prototype["lav"] = true;
Iso639LangCodes_LangCodes.prototype["lb"] = true;
Iso639LangCodes_LangCodes.prototype["lez"] = true;
Iso639LangCodes_LangCodes.prototype["lg"] = true;
Iso639LangCodes_LangCodes.prototype["li"] = true;
Iso639LangCodes_LangCodes.prototype["lim"] = true;
Iso639LangCodes_LangCodes.prototype["lin"] = true;
Iso639LangCodes_LangCodes.prototype["lit"] = true;
Iso639LangCodes_LangCodes.prototype["ln"] = true;
Iso639LangCodes_LangCodes.prototype["lo"] = true;
Iso639LangCodes_LangCodes.prototype["lol"] = true;
Iso639LangCodes_LangCodes.prototype["loz"] = true;
Iso639LangCodes_LangCodes.prototype["lt"] = true;
Iso639LangCodes_LangCodes.prototype["ltz"] = true;
Iso639LangCodes_LangCodes.prototype["lu"] = true;
Iso639LangCodes_LangCodes.prototype["lua"] = true;
Iso639LangCodes_LangCodes.prototype["lub"] = true;
Iso639LangCodes_LangCodes.prototype["lug"] = true;
Iso639LangCodes_LangCodes.prototype["lui"] = true;
Iso639LangCodes_LangCodes.prototype["lun"] = true;
Iso639LangCodes_LangCodes.prototype["luo"] = true;
Iso639LangCodes_LangCodes.prototype["lus"] = true;
Iso639LangCodes_LangCodes.prototype["lv"] = true;
Iso639LangCodes_LangCodes.prototype["mac"] = true;
Iso639LangCodes_LangCodes.prototype["mad"] = true;
Iso639LangCodes_LangCodes.prototype["mag"] = true;
Iso639LangCodes_LangCodes.prototype["mah"] = true;
Iso639LangCodes_LangCodes.prototype["mai"] = true;
Iso639LangCodes_LangCodes.prototype["mak"] = true;
Iso639LangCodes_LangCodes.prototype["mal"] = true;
Iso639LangCodes_LangCodes.prototype["man"] = true;
Iso639LangCodes_LangCodes.prototype["mao"] = true;
Iso639LangCodes_LangCodes.prototype["mao"] = true;
Iso639LangCodes_LangCodes.prototype["map"] = true;
Iso639LangCodes_LangCodes.prototype["mar"] = true;
Iso639LangCodes_LangCodes.prototype["mas"] = true;
Iso639LangCodes_LangCodes.prototype["may"] = true;
Iso639LangCodes_LangCodes.prototype["may"] = true;
Iso639LangCodes_LangCodes.prototype["mdf"] = true;
Iso639LangCodes_LangCodes.prototype["mdr"] = true;
Iso639LangCodes_LangCodes.prototype["men"] = true;
Iso639LangCodes_LangCodes.prototype["mg"] = true;
Iso639LangCodes_LangCodes.prototype["mga"] = true;
Iso639LangCodes_LangCodes.prototype["mh"] = true;
Iso639LangCodes_LangCodes.prototype["mi"] = true;
Iso639LangCodes_LangCodes.prototype["mi"] = true;
Iso639LangCodes_LangCodes.prototype["mic"] = true;
Iso639LangCodes_LangCodes.prototype["min"] = true;
Iso639LangCodes_LangCodes.prototype["mis"] = true;
Iso639LangCodes_LangCodes.prototype["mk"] = true;
Iso639LangCodes_LangCodes.prototype["mk"] = true;
Iso639LangCodes_LangCodes.prototype["mkd"] = true;
Iso639LangCodes_LangCodes.prototype["mkd"] = true;
Iso639LangCodes_LangCodes.prototype["mkh"] = true;
Iso639LangCodes_LangCodes.prototype["ml"] = true;
Iso639LangCodes_LangCodes.prototype["mlg"] = true;
Iso639LangCodes_LangCodes.prototype["mlt"] = true;
Iso639LangCodes_LangCodes.prototype["mn"] = true;
Iso639LangCodes_LangCodes.prototype["mnc"] = true;
Iso639LangCodes_LangCodes.prototype["mni"] = true;
Iso639LangCodes_LangCodes.prototype["mno"] = true;
Iso639LangCodes_LangCodes.prototype["mo"] = true;
Iso639LangCodes_LangCodes.prototype["moh"] = true;
Iso639LangCodes_LangCodes.prototype["mol"] = true;
Iso639LangCodes_LangCodes.prototype["mon"] = true;
Iso639LangCodes_LangCodes.prototype["mos"] = true;
Iso639LangCodes_LangCodes.prototype["mr"] = true;
Iso639LangCodes_LangCodes.prototype["mri"] = true;
Iso639LangCodes_LangCodes.prototype["mri"] = true;
Iso639LangCodes_LangCodes.prototype["ms"] = true;
Iso639LangCodes_LangCodes.prototype["ms"] = true;
Iso639LangCodes_LangCodes.prototype["msa"] = true;
Iso639LangCodes_LangCodes.prototype["msa"] = true;
Iso639LangCodes_LangCodes.prototype["mt"] = true;
Iso639LangCodes_LangCodes.prototype["mul"] = true;
Iso639LangCodes_LangCodes.prototype["mun"] = true;
Iso639LangCodes_LangCodes.prototype["mus"] = true;
Iso639LangCodes_LangCodes.prototype["mwl"] = true;
Iso639LangCodes_LangCodes.prototype["mwr"] = true;
Iso639LangCodes_LangCodes.prototype["my"] = true;
Iso639LangCodes_LangCodes.prototype["my"] = true;
Iso639LangCodes_LangCodes.prototype["mya"] = true;
Iso639LangCodes_LangCodes.prototype["mya"] = true;
Iso639LangCodes_LangCodes.prototype["myn"] = true;
Iso639LangCodes_LangCodes.prototype["myv"] = true;
Iso639LangCodes_LangCodes.prototype["na"] = true;
Iso639LangCodes_LangCodes.prototype["nah"] = true;
Iso639LangCodes_LangCodes.prototype["nai"] = true;
Iso639LangCodes_LangCodes.prototype["nap"] = true;
Iso639LangCodes_LangCodes.prototype["nau"] = true;
Iso639LangCodes_LangCodes.prototype["nav"] = true;
Iso639LangCodes_LangCodes.prototype["nb"] = true;
Iso639LangCodes_LangCodes.prototype["nbl"] = true;
Iso639LangCodes_LangCodes.prototype["nd"] = true;
Iso639LangCodes_LangCodes.prototype["nde"] = true;
Iso639LangCodes_LangCodes.prototype["ndo"] = true;
Iso639LangCodes_LangCodes.prototype["nds"] = true;
Iso639LangCodes_LangCodes.prototype["ne"] = true;
Iso639LangCodes_LangCodes.prototype["nep"] = true;
Iso639LangCodes_LangCodes.prototype["new"] = true;
Iso639LangCodes_LangCodes.prototype["ng"] = true;
Iso639LangCodes_LangCodes.prototype["nia"] = true;
Iso639LangCodes_LangCodes.prototype["nic"] = true;
Iso639LangCodes_LangCodes.prototype["niu"] = true;
Iso639LangCodes_LangCodes.prototype["nl"] = true;
Iso639LangCodes_LangCodes.prototype["nl"] = true;
Iso639LangCodes_LangCodes.prototype["nld"] = true;
Iso639LangCodes_LangCodes.prototype["nld"] = true;
Iso639LangCodes_LangCodes.prototype["nn"] = true;
Iso639LangCodes_LangCodes.prototype["nno"] = true;
Iso639LangCodes_LangCodes.prototype["no"] = true;
Iso639LangCodes_LangCodes.prototype["nob"] = true;
Iso639LangCodes_LangCodes.prototype["nog"] = true;
Iso639LangCodes_LangCodes.prototype["non"] = true;
Iso639LangCodes_LangCodes.prototype["nor"] = true;
Iso639LangCodes_LangCodes.prototype["nr"] = true;
Iso639LangCodes_LangCodes.prototype["nso"] = true;
Iso639LangCodes_LangCodes.prototype["nub"] = true;
Iso639LangCodes_LangCodes.prototype["nv"] = true;
Iso639LangCodes_LangCodes.prototype["nwc"] = true;
Iso639LangCodes_LangCodes.prototype["ny"] = true;
Iso639LangCodes_LangCodes.prototype["nya"] = true;
Iso639LangCodes_LangCodes.prototype["nym"] = true;
Iso639LangCodes_LangCodes.prototype["nyn"] = true;
Iso639LangCodes_LangCodes.prototype["nyo"] = true;
Iso639LangCodes_LangCodes.prototype["nzi"] = true;
Iso639LangCodes_LangCodes.prototype["oc"] = true;
Iso639LangCodes_LangCodes.prototype["oci"] = true;
Iso639LangCodes_LangCodes.prototype["oj"] = true;
Iso639LangCodes_LangCodes.prototype["oji"] = true;
Iso639LangCodes_LangCodes.prototype["om"] = true;
Iso639LangCodes_LangCodes.prototype["or"] = true;
Iso639LangCodes_LangCodes.prototype["ori"] = true;
Iso639LangCodes_LangCodes.prototype["orm"] = true;
Iso639LangCodes_LangCodes.prototype["os"] = true;
Iso639LangCodes_LangCodes.prototype["osa"] = true;
Iso639LangCodes_LangCodes.prototype["oss"] = true;
Iso639LangCodes_LangCodes.prototype["ota"] = true;
Iso639LangCodes_LangCodes.prototype["oto"] = true;
Iso639LangCodes_LangCodes.prototype["pa"] = true;
Iso639LangCodes_LangCodes.prototype["paa"] = true;
Iso639LangCodes_LangCodes.prototype["pag"] = true;
Iso639LangCodes_LangCodes.prototype["pal"] = true;
Iso639LangCodes_LangCodes.prototype["pam"] = true;
Iso639LangCodes_LangCodes.prototype["pan"] = true;
Iso639LangCodes_LangCodes.prototype["pap"] = true;
Iso639LangCodes_LangCodes.prototype["pau"] = true;
Iso639LangCodes_LangCodes.prototype["peo"] = true;
Iso639LangCodes_LangCodes.prototype["per"] = true;
Iso639LangCodes_LangCodes.prototype["per"] = true;
Iso639LangCodes_LangCodes.prototype["phi"] = true;
Iso639LangCodes_LangCodes.prototype["phn"] = true;
Iso639LangCodes_LangCodes.prototype["pi"] = true;
Iso639LangCodes_LangCodes.prototype["pl"] = true;
Iso639LangCodes_LangCodes.prototype["pli"] = true;
Iso639LangCodes_LangCodes.prototype["pol"] = true;
Iso639LangCodes_LangCodes.prototype["pon"] = true;
Iso639LangCodes_LangCodes.prototype["por"] = true;
Iso639LangCodes_LangCodes.prototype["pra"] = true;
Iso639LangCodes_LangCodes.prototype["pro"] = true;
Iso639LangCodes_LangCodes.prototype["ps"] = true;
Iso639LangCodes_LangCodes.prototype["pt"] = true;
Iso639LangCodes_LangCodes.prototype["pus"] = true;
Iso639LangCodes_LangCodes.prototype["qaa"] = true;
Iso639LangCodes_LangCodes.prototype["qtz"] = true;
Iso639LangCodes_LangCodes.prototype["qu"] = true;
Iso639LangCodes_LangCodes.prototype["que"] = true;
Iso639LangCodes_LangCodes.prototype["raj"] = true;
Iso639LangCodes_LangCodes.prototype["rap"] = true;
Iso639LangCodes_LangCodes.prototype["rar"] = true;
Iso639LangCodes_LangCodes.prototype["rm"] = true;
Iso639LangCodes_LangCodes.prototype["rn"] = true;
Iso639LangCodes_LangCodes.prototype["ro"] = true;
Iso639LangCodes_LangCodes.prototype["roa"] = true;
Iso639LangCodes_LangCodes.prototype["roh"] = true;
Iso639LangCodes_LangCodes.prototype["rom"] = true;
Iso639LangCodes_LangCodes.prototype["ron"] = true;
Iso639LangCodes_LangCodes.prototype["ru"] = true;
Iso639LangCodes_LangCodes.prototype["rum"] = true;
Iso639LangCodes_LangCodes.prototype["run"] = true;
Iso639LangCodes_LangCodes.prototype["rus"] = true;
Iso639LangCodes_LangCodes.prototype["rw"] = true;
Iso639LangCodes_LangCodes.prototype["sa"] = true;
Iso639LangCodes_LangCodes.prototype["sad"] = true;
Iso639LangCodes_LangCodes.prototype["sag"] = true;
Iso639LangCodes_LangCodes.prototype["sah"] = true;
Iso639LangCodes_LangCodes.prototype["sai"] = true;
Iso639LangCodes_LangCodes.prototype["sal"] = true;
Iso639LangCodes_LangCodes.prototype["sam"] = true;
Iso639LangCodes_LangCodes.prototype["san"] = true;
Iso639LangCodes_LangCodes.prototype["sas"] = true;
Iso639LangCodes_LangCodes.prototype["sat"] = true;
Iso639LangCodes_LangCodes.prototype["sc"] = true;
Iso639LangCodes_LangCodes.prototype["scc"] = true;
Iso639LangCodes_LangCodes.prototype["scc"] = true;
Iso639LangCodes_LangCodes.prototype["scn"] = true;
Iso639LangCodes_LangCodes.prototype["sco"] = true;
Iso639LangCodes_LangCodes.prototype["scr"] = true;
Iso639LangCodes_LangCodes.prototype["scr"] = true;
Iso639LangCodes_LangCodes.prototype["sd"] = true;
Iso639LangCodes_LangCodes.prototype["se"] = true;
Iso639LangCodes_LangCodes.prototype["sel"] = true;
Iso639LangCodes_LangCodes.prototype["sem"] = true;
Iso639LangCodes_LangCodes.prototype["sg"] = true;
Iso639LangCodes_LangCodes.prototype["sga"] = true;
Iso639LangCodes_LangCodes.prototype["sgn"] = true;
Iso639LangCodes_LangCodes.prototype["shn"] = true;
Iso639LangCodes_LangCodes.prototype["si"] = true;
Iso639LangCodes_LangCodes.prototype["sid"] = true;
Iso639LangCodes_LangCodes.prototype["sin"] = true;
Iso639LangCodes_LangCodes.prototype["sio"] = true;
Iso639LangCodes_LangCodes.prototype["sit"] = true;
Iso639LangCodes_LangCodes.prototype["sk"] = true;
Iso639LangCodes_LangCodes.prototype["sl"] = true;
Iso639LangCodes_LangCodes.prototype["sla"] = true;
Iso639LangCodes_LangCodes.prototype["slk"] = true;
Iso639LangCodes_LangCodes.prototype["slo"] = true;
Iso639LangCodes_LangCodes.prototype["slv"] = true;
Iso639LangCodes_LangCodes.prototype["sm"] = true;
Iso639LangCodes_LangCodes.prototype["sma"] = true;
Iso639LangCodes_LangCodes.prototype["sme"] = true;
Iso639LangCodes_LangCodes.prototype["smi"] = true;
Iso639LangCodes_LangCodes.prototype["smj"] = true;
Iso639LangCodes_LangCodes.prototype["smn"] = true;
Iso639LangCodes_LangCodes.prototype["smo"] = true;
Iso639LangCodes_LangCodes.prototype["sms"] = true;
Iso639LangCodes_LangCodes.prototype["sn"] = true;
Iso639LangCodes_LangCodes.prototype["sna"] = true;
Iso639LangCodes_LangCodes.prototype["snd"] = true;
Iso639LangCodes_LangCodes.prototype["snk"] = true;
Iso639LangCodes_LangCodes.prototype["so"] = true;
Iso639LangCodes_LangCodes.prototype["sog"] = true;
Iso639LangCodes_LangCodes.prototype["som"] = true;
Iso639LangCodes_LangCodes.prototype["son"] = true;
Iso639LangCodes_LangCodes.prototype["sot"] = true;
Iso639LangCodes_LangCodes.prototype["spa"] = true;
Iso639LangCodes_LangCodes.prototype["sq"] = true;
Iso639LangCodes_LangCodes.prototype["sqi"] = true;
Iso639LangCodes_LangCodes.prototype["sr"] = true;
Iso639LangCodes_LangCodes.prototype["srd"] = true;
Iso639LangCodes_LangCodes.prototype["srp"] = true;
Iso639LangCodes_LangCodes.prototype["srr"] = true;
Iso639LangCodes_LangCodes.prototype["ss"] = true;
Iso639LangCodes_LangCodes.prototype["ssa"] = true;
Iso639LangCodes_LangCodes.prototype["ssw"] = true;
Iso639LangCodes_LangCodes.prototype["st"] = true;
Iso639LangCodes_LangCodes.prototype["su"] = true;
Iso639LangCodes_LangCodes.prototype["suk"] = true;
Iso639LangCodes_LangCodes.prototype["sun"] = true;
Iso639LangCodes_LangCodes.prototype["sus"] = true;
Iso639LangCodes_LangCodes.prototype["sux"] = true;
Iso639LangCodes_LangCodes.prototype["sv"] = true;
Iso639LangCodes_LangCodes.prototype["sw"] = true;
Iso639LangCodes_LangCodes.prototype["swa"] = true;
Iso639LangCodes_LangCodes.prototype["swe"] = true;
Iso639LangCodes_LangCodes.prototype["syr"] = true;
Iso639LangCodes_LangCodes.prototype["ta"] = true;
Iso639LangCodes_LangCodes.prototype["tah"] = true;
Iso639LangCodes_LangCodes.prototype["tai"] = true;
Iso639LangCodes_LangCodes.prototype["tam"] = true;
Iso639LangCodes_LangCodes.prototype["tat"] = true;
Iso639LangCodes_LangCodes.prototype["te"] = true;
Iso639LangCodes_LangCodes.prototype["tel"] = true;
Iso639LangCodes_LangCodes.prototype["tem"] = true;
Iso639LangCodes_LangCodes.prototype["ter"] = true;
Iso639LangCodes_LangCodes.prototype["tet"] = true;
Iso639LangCodes_LangCodes.prototype["tg"] = true;
Iso639LangCodes_LangCodes.prototype["tgk"] = true;
Iso639LangCodes_LangCodes.prototype["tgl"] = true;
Iso639LangCodes_LangCodes.prototype["th"] = true;
Iso639LangCodes_LangCodes.prototype["tha"] = true;
Iso639LangCodes_LangCodes.prototype["ti"] = true;
Iso639LangCodes_LangCodes.prototype["tib"] = true;
Iso639LangCodes_LangCodes.prototype["tib"] = true;
Iso639LangCodes_LangCodes.prototype["tig"] = true;
Iso639LangCodes_LangCodes.prototype["tir"] = true;
Iso639LangCodes_LangCodes.prototype["tiv"] = true;
Iso639LangCodes_LangCodes.prototype["tk"] = true;
Iso639LangCodes_LangCodes.prototype["tkl"] = true;
Iso639LangCodes_LangCodes.prototype["tl"] = true;
Iso639LangCodes_LangCodes.prototype["tlh"] = true;
Iso639LangCodes_LangCodes.prototype["tli"] = true;
Iso639LangCodes_LangCodes.prototype["tmh"] = true;
Iso639LangCodes_LangCodes.prototype["tn"] = true;
Iso639LangCodes_LangCodes.prototype["to"] = true;
Iso639LangCodes_LangCodes.prototype["tog"] = true;
Iso639LangCodes_LangCodes.prototype["ton"] = true;
Iso639LangCodes_LangCodes.prototype["tpi"] = true;
Iso639LangCodes_LangCodes.prototype["tr"] = true;
Iso639LangCodes_LangCodes.prototype["ts"] = true;
Iso639LangCodes_LangCodes.prototype["tsi"] = true;
Iso639LangCodes_LangCodes.prototype["tsn"] = true;
Iso639LangCodes_LangCodes.prototype["tso"] = true;
Iso639LangCodes_LangCodes.prototype["tt"] = true;
Iso639LangCodes_LangCodes.prototype["tuk"] = true;
Iso639LangCodes_LangCodes.prototype["tum"] = true;
Iso639LangCodes_LangCodes.prototype["tup"] = true;
Iso639LangCodes_LangCodes.prototype["tur"] = true;
Iso639LangCodes_LangCodes.prototype["tut"] = true;
Iso639LangCodes_LangCodes.prototype["tvl"] = true;
Iso639LangCodes_LangCodes.prototype["tw"] = true;
Iso639LangCodes_LangCodes.prototype["twi"] = true;
Iso639LangCodes_LangCodes.prototype["ty"] = true;
Iso639LangCodes_LangCodes.prototype["tyv"] = true;
Iso639LangCodes_LangCodes.prototype["udm"] = true;
Iso639LangCodes_LangCodes.prototype["ug"] = true;
Iso639LangCodes_LangCodes.prototype["uga"] = true;
Iso639LangCodes_LangCodes.prototype["uig"] = true;
Iso639LangCodes_LangCodes.prototype["uk"] = true;
Iso639LangCodes_LangCodes.prototype["ukr"] = true;
Iso639LangCodes_LangCodes.prototype["umb"] = true;
Iso639LangCodes_LangCodes.prototype["und"] = true;
Iso639LangCodes_LangCodes.prototype["ur"] = true;
Iso639LangCodes_LangCodes.prototype["urd"] = true;
Iso639LangCodes_LangCodes.prototype["uz"] = true;
Iso639LangCodes_LangCodes.prototype["uzb"] = true;
Iso639LangCodes_LangCodes.prototype["vai"] = true;
Iso639LangCodes_LangCodes.prototype["ve"] = true;
Iso639LangCodes_LangCodes.prototype["ven"] = true;
Iso639LangCodes_LangCodes.prototype["vi"] = true;
Iso639LangCodes_LangCodes.prototype["vie"] = true;
Iso639LangCodes_LangCodes.prototype["vo"] = true;
Iso639LangCodes_LangCodes.prototype["vol"] = true;
Iso639LangCodes_LangCodes.prototype["vot"] = true;
Iso639LangCodes_LangCodes.prototype["wa"] = true;
Iso639LangCodes_LangCodes.prototype["wak"] = true;
Iso639LangCodes_LangCodes.prototype["wal"] = true;
Iso639LangCodes_LangCodes.prototype["war"] = true;
Iso639LangCodes_LangCodes.prototype["was"] = true;
Iso639LangCodes_LangCodes.prototype["wel"] = true;
Iso639LangCodes_LangCodes.prototype["wel"] = true;
Iso639LangCodes_LangCodes.prototype["wen"] = true;
Iso639LangCodes_LangCodes.prototype["wln"] = true;
Iso639LangCodes_LangCodes.prototype["wo"] = true;
Iso639LangCodes_LangCodes.prototype["wol"] = true;
Iso639LangCodes_LangCodes.prototype["xal"] = true;
Iso639LangCodes_LangCodes.prototype["xh"] = true;
Iso639LangCodes_LangCodes.prototype["xho"] = true;
Iso639LangCodes_LangCodes.prototype["yao"] = true;
Iso639LangCodes_LangCodes.prototype["yap"] = true;
Iso639LangCodes_LangCodes.prototype["yi"] = true;
Iso639LangCodes_LangCodes.prototype["yid"] = true;
Iso639LangCodes_LangCodes.prototype["yo"] = true;
Iso639LangCodes_LangCodes.prototype["yor"] = true;
Iso639LangCodes_LangCodes.prototype["ypk"] = true;
Iso639LangCodes_LangCodes.prototype["za"] = true;
Iso639LangCodes_LangCodes.prototype["zap"] = true;
Iso639LangCodes_LangCodes.prototype["zen"] = true;
Iso639LangCodes_LangCodes.prototype["zh"] = true;
Iso639LangCodes_LangCodes.prototype["zh"] = true;
Iso639LangCodes_LangCodes.prototype["zha"] = true;
Iso639LangCodes_LangCodes.prototype["zho"] = true;
Iso639LangCodes_LangCodes.prototype["zho"] = true;
Iso639LangCodes_LangCodes.prototype["znd"] = true;
Iso639LangCodes_LangCodes.prototype["zu"] = true;
Iso639LangCodes_LangCodes.prototype["zul"] = true;
Iso639LangCodes_LangCodes.prototype["zun"] = true;
Iso639LangCodes_LangCodes.prototype.IsValid = Iso639LangCodes_IsValid;

function Iso639LangCodes_IsValid(str) {
    if (str == "i" || str == "x") {
        return true;
    }
    if (this[str] === true) {
        return true;
    }
    return false;
}

function Iso639LangCodes_LangCodes() {}

function LogCompression(_157) {
    this.dictionary = _157;
    this.dictKeyDelimiter = this.dictionary["delimiter"];
}
LogCompression.prototype.decompressXmltoString = function(_158) {
    var str = _158.toString();
    var _15a = this.dictionary;
    var _15b = new RegExp(this.dictKeyDelimiter + "([0-9]{1,4})" + this.dictKeyDelimiter, "g");

    function getDictionaryValueforStrReplace() {
        return _15a[arguments[1]];
    }
    return str.replace(_15b, getDictionaryValueforStrReplace);
};
LogCompression.prototype.decompressString = function(_15c) {
    var _15d = this.dictionary;
    var _15e = new RegExp(this.dictKeyDelimiter + "([0-9]{1,4})" + this.dictKeyDelimiter, "g");

    function getDictionaryValueforStrReplace() {
        return _15d[arguments[1]];
    }
    return _15c.replace(_15e, getDictionaryValueforStrReplace);
};

function MenuItem(_15f, _160, _161, _162) {
    this.ParentMenuItem = _15f;
    this.Document = _161;
    this.ActivityId = _160.GetItemIdentifier() + _160.GetDatabaseIdentifier();
    this.MenuElementId = "MenuItem" + this.ActivityId;
    this.DivTag = null;
    if (_15f === null) {
        this.Level = 0;
    } else {
        this.Level = _15f.Level + 1;
    }
    this.Children = new Array();
    this.Visible = true;
    this.Enabled = true;
    var node = this.Document.createElement("div");
    node.id = this.MenuElementId;
    this.DivTag = node;
    this.CurrentDisplayState = null;
    this.CurrentDisplayState = IntegrationImplementation.PopulateMenuItemDivTag(node, this.Document, this.ActivityId, _160.GetTitle(), this.Level, _160.IsDeliverable(), Control.Package.LearningStandard, Control.Package.Properties.StatusDisplay, _160.GetItemIdentifier(), _160, this);
}
MenuItem.prototype.Render = MenuItem_Render;
MenuItem.prototype.UpdateStateDisplay = MenuItem_UpdateStateDisplay;
MenuItem.prototype.Hide = MenuItem_Hide;
MenuItem.prototype.Show = MenuItem_Show;
MenuItem.prototype.Enable = MenuItem_Enable;
MenuItem.prototype.Disable = MenuItem_Disable;
MenuItem.prototype.BumpUpLevel = MenuItem_BumpUpLevel;
MenuItem.prototype.BumpDownLevel = MenuItem_BumpDownLevel;
MenuItem.prototype.ResynchChildren = MenuItem_ResynchChildren;

function MenuItem_Render(_164) {
    var _165;
    if (this.ParentMenuItem === null) {
        _165 = IntegrationImplementation.GetHtmlElementToInsertMenuWithin();
        _165.insertBefore(this.DivTag, null);
        return;
    } else {
        var i;
        for (i = 0; i < this.ParentMenuItem.Children.length; i++) {
            if (this.ParentMenuItem.Children[i].ActivityId == this.ActivityId) {
                break;
            }
        }
        if (i === 0) {
            _165 = this.Document.getElementById(this.ParentMenuItem.MenuElementId);
        } else {
            var _167 = this.ParentMenuItem.Children[i - 1];
            var _168 = MenuItem_getLastSubmenuItem(_167);
            _165 = this.Document.getElementById(_168.MenuElementId);
        }
    }
    _165.parentNode.insertBefore(this.DivTag, _165.nextSibling);
    if (_164.DisplayInChoice() === true) {
        this.Show();
    } else {
        this.Hide();
    }
}

function MenuItem_UpdateStateDisplay(_169, _16a, _16b, _16c) {
    var _16d = true;
    var _16e = true;
    if (_169.DisplayInChoice() === true) {
        _16d = true;
    } else {
        _16d = false;
    }
    if (!_16b.WillSucceed) {
        if (Control.Package.Properties.InvalidMenuItemAction == INVALID_MENU_ITEM_ACTION_DISABLE) {
            _16e = false;
        } else {
            if (Control.Package.Properties.InvalidMenuItemAction == INVALID_MENU_ITEM_ACTION_HIDE) {
                _16d = false;
            } else {
                if (Control.Package.Properties.InvalidMenuItemAction == INVALID_MENU_ITEM_ACTION_SHOW_ENABLE) {
                    _16d = true;
                }
            }
        }
    } else {
        if (Control.Package.Properties.InvalidMenuItemAction == INVALID_MENU_ITEM_ACTION_DISABLE) {
            _16e = true;
        } else {
            if (Control.Package.Properties.InvalidMenuItemAction == INVALID_MENU_ITEM_ACTION_HIDE) {
                _16d = true;
            } else {
                if (Control.Package.Properties.InvalidMenuItemAction == INVALID_MENU_ITEM_ACTION_SHOW_ENABLE) {
                    _16d = true;
                }
            }
        }
    }
    if (_16d != this.Visible) {
        if (_16d == true) {
            this.Show();
        } else {
            this.Hide();
        }
    }
    if (_169.IsTheRoot() === true && Control.Package.Properties.ForceDisableRootChoice === true) {
        _16e = false;
    }
    if (_16e != this.Enabled) {
        if (_16e == true) {
            this.Enable(_169.GetItemIdentifier(), _169.GetTitle());
        } else {
            this.Disable();
        }
    }
    this.CurrentDisplayState = IntegrationImplementation.UpdateMenuStateDisplay(this.DivTag, this.Document, _169, this.ActivityId, _169.IsDeliverable(), _16a, _16b, Control.Package.LearningStandard, Control.Package.Properties.StatusDisplay, this.CurrentDisplayState, _16c);
}

function MenuItem_Hide() {
    if (this.Visible === true) {
        this.DivTag.style.display = "none";
        this.BumpDownLevel(this);
    }
    this.Visible = false;
}

function MenuItem_Show() {
    if (this.Visible === false) {
        this.DivTag.style.display = "inline";
        this.BumpUpLevel(this);
    }
    this.Visible = true;
}

function MenuItem_Enable(_16f, _170) {
    if (this.Enabled === false) {
        var _171 = navigator.appName;
        var _172 = parseInt(navigator.appVersion, 10);
        if (_171 == "Microsoft Internet Explorer" && _172 < 6) {
            this.DivTag.onmouseover = function() {
                this.style.cursor = "hand";
                window.status = _170;
                return true;
            };
        } else {
            this.DivTag.onmouseover = function() {
                this.style.cursor = "pointer";
                window.status = _170;
                return true;
            };
        }
        this.DivTag.onclick = function() {
            var _173 = GetController();
            _173.ChoiceRequest(_16f);
            return true;
        };
    }
    this.Enabled = true;
}

function MenuItem_Disable() {
    if (this.Enabled === true) {
        this.DivTag.onmouseover = function() {
            this.style.cursor = "default";
            window.status = "";
            return true;
        };
        this.DivTag.onclick = "";
    }
    this.Enabled = false;
}

function MenuItem_BumpUpLevel(_174) {
    _174.Level++;
    IntegrationImplementation.UpdateIndentLevel(_174.DivTag, _174.ActivityId, _174.Level);
    for (var _175 in _174.Children) {
        _174.BumpUpLevel(_174.Children[_175]);
    }
}

function MenuItem_BumpDownLevel(_176) {
    _176.Level--;
    IntegrationImplementation.UpdateIndentLevel(_176.DivTag, _176.ActivityId, _176.Level);
    for (var _177 in _176.Children) {
        _176.BumpDownLevel(_176.Children[_177]);
    }
}

function MenuItem_ResynchChildren(_178) {
    var _179;
    for (var _17a in this.Children) {
        _179 = this.Children[_17a].DivTag;
        _179.parentNode.removeChild(_179);
    }
    this.Children = new Array();
    var _17b = _178.GetAvailableChildren();
    for (var _17c in _17b) {
        this.Children[_17c] = _17b[_17c].MenuItem;
    }
}

function MenuItem_getLastSubmenuItem(_17d) {
    if (_17d.Children.length === 0) {
        return _17d;
    } else {
        return MenuItem_getLastSubmenuItem(_17d.Children[_17d.Children.length - 1]);
    }
}

function ScoLoader(_17e, _17f, _180, _181, _182, _183) {
    this.IntermediatePage = _17e;
    this.PopupLauncherPage = _17f;
    this.PathToCourse = _180;
    this.ScoLaunchType = _181;
    this.WrapScoWindowWithApi = _182;
    this.Standard = _183;
    this.ScoLoaded = false;
    this.ContentFrame = ScoLoader_FindContentFrame(window);
    if (this.ContentFrame === null) {
        Debug.AssertError("Unable to locate the content frame-" + IntegrationImplementation.CONTENT_FRAME_NAME);
    }
}
ScoLoader.prototype.LoadSco = ScoLoader_LoadSco;
ScoLoader.prototype.UnloadSco = ScoLoader_UnloadSco;
ScoLoader.prototype.WriteHistoryLog = ScoLoader_WriteHistoryLog;
ScoLoader.prototype.WriteHistoryReturnValue = ScoLoader_WriteHistoryReturnValue;
ScoLoader.prototype.ConstructPreviewAiccSid = ScoLoader_ConstructPreviewAiccSid;

function ScoLoader_WriteHistoryLog(str, atts) {
    HistoryLog.WriteEventDetailed(str, atts);
}

function ScoLoader_WriteHistoryReturnValue(str, atts) {
    HistoryLog.WriteEventDetailedReturnValue(str, atts);
}

function ScoLoader_LoadSco(_188) {
    var _189 = {
        ev: "LoadSco"
    };
    if (_188) {
        _189.ai = _188.ItemIdentifier;
        _189.at = _188.LearningObject.Title;
    }
    this.WriteHistoryLog("", _189);
    _188.LaunchedThisSession = false;
    if (_188.GetActivityStartTimestampUtc() === null) {
        _188.SetActivityStartTimestampUtc(ConvertDateToIso8601String(new Date()));
    }
    if (_188.GetAttemptStartTimestampUtc() === null) {
        _188.SetAttemptStartTimestampUtc(ConvertDateToIso8601String(new Date()));
    }
    var _18a = "";
    if (this.Standard.isAICC()) {
        var _18b = ExternalRegistrationId == "";
        var _18c;
        if (_18b) {
            _18c = "AICC_SID=" + escape(this.ConstructPreviewAiccSid(_188) + escape(ExternalConfig));
        } else {
            _18c = "AICC_SID=" + escape(_188.AiccSessionId);
            var _18d = _188.AiccSessionId.length == 36 && _188.AiccSessionId.indexOf("~") < 0;
            if (_18d) {
                _18c += escape(escape(ExternalConfig));
            }
        }
        _18a += _18c + "&AICC_URL=" + escape(AICC_RESULTS_PAGE);
    }
    var _18e = "";
    if (this.PathToCourse.length > 0 && _188.GetLaunchPath().toLowerCase().indexOf("http://") != 0 && _188.GetLaunchPath().toLowerCase().indexOf("https://") != 0) {
        _18e = this.PathToCourse;
        if (this.PathToCourse.lastIndexOf("/") != (this.PathToCourse.length - 1)) {
            _18e += "/";
        }
        _18e += _188.GetLaunchPath();
    } else {
        _18e = _188.GetLaunchPath();
    }
    var _18f;
    if (_18a !== "") {
        _18e = MergeQueryStringParameters(_18e, _18a);
    }
    if (this.ScoLaunchType == LAUNCH_TYPE_FRAMESET) {
        Control.WriteDetailedLog("`1452`" + _18e);
        this.ContentFrame.location = _18e;
        Control.Api.InitTrackedTimeStart(_188);
        _188.SetLaunchedThisSession();
    } else {
        if (this.ScoLaunchType == LAUNCH_TYPE_POPUP || this.ScoLaunchType == LAUNCH_TYPE_POPUP_WITHOUT_BROWSER_TOOLBAR || this.ScoLaunchType == LAUNCH_TYPE_POPUP_WITH_MENU || this.ScoLaunchType == LAUNCH_TYPE_POPUP_AFTER_CLICK || this.ScoLaunchType == LAUNCH_TYPE_POPUP_AFTER_CLICK_WITHOUT_BROWSER_TOOLBAR) {
            var _190;
            if (this.ScoLaunchType == LAUNCH_TYPE_POPUP_WITHOUT_BROWSER_TOOLBAR || this.ScoLaunchType == LAUNCH_TYPE_POPUP_AFTER_CLICK_WITHOUT_BROWSER_TOOLBAR) {
                _190 = "false";
            } else {
                _190 = "true";
            }
            var _191;
            if (this.ScoLaunchType == LAUNCH_TYPE_POPUP_WITH_MENU) {
                _191 = "yes";
            } else {
                _191 = "no";
            }
            var _192;
            if (this.ScoLaunchType == LAUNCH_TYPE_POPUP_AFTER_CLICK || this.ScoLaunchType == LAUNCH_TYPE_POPUP_AFTER_CLICK_WITHOUT_BROWSER_TOOLBAR) {
                _192 = "true";
            } else {
                _192 = "false";
            }
            if (this.WrapScoWindowWithApi === true) {
                _18f = MergeQueryStringParameters(this.PopupLauncherPage.PageHref, this.PopupLauncherPage.Parameters, "ScoUrl=" + escape(_18e), "LaunchAfterClick=" + _192, "WrapApi=true", "ShowToolbar=" + _190, "ShowMenubar=" + _191);
            } else {
                _18f = MergeQueryStringParameters(this.PopupLauncherPage.PageHref, this.PopupLauncherPage.Parameters, "ScoUrl=" + escape(_18e), "LaunchAfterClick=" + _192, "ShowToolbar=" + _190, "ShowMenubar=" + _191);
            }
            this.ContentFrame.location = _18f;
        } else {
            Debug.AssertError("Invalid Sco Launch Type");
        }
    }
}

function ScoLoader_UnloadSco(_193) {
    var path = "";
    if (Control.Package.Properties.MakeStudentPrefsGlobalToCourse === true) {
        Control.UpdateGlobalLearnerPrefs();
    }
    if (Control.DeliverFramesetUnloadEventCalled) {
        var _195 = SCORM_RESULTS_PAGE.toLowerCase().indexOf("recordresults");
        var _196 = SCORM_RESULTS_PAGE.substring(0, _195);
        path = _196 + "blank.html";
    } else {
        if (_193 === true) {
            path = MergeQueryStringParameters(this.IntermediatePage.PageHref, this.IntermediatePage.Parameters, "MessageWaiting=true");
        } else {
            path = MergeQueryStringParameters(this.IntermediatePage.PageHref, this.IntermediatePage.Parameters);
        }
    }
    if ((this.ScoLaunchType == LAUNCH_TYPE_POPUP || this.ScoLaunchType == LAUNCH_TYPE_POPUP_AFTER_CLICK) && this.ContentFrame.CloseSco) {
        if (Control.DeliverFramesetUnloadEventCalled) {
            if (this.ContentFrame.scoWindow && this.ContentFrame.scoWindow !== null && !this.ContentFrame.scoWindow.closed) {
                this.ContentFrame.scoWindow.close();
            }
            this.ContentFrame.location = path;
        } else {
            Control.WriteDetailedLog("`1740`");
            this.ContentFrame.CloseSco();
            Control.WriteDetailedLog("`1357`" + path);
            window.setTimeout("Control.ScoLoader.ContentFrame.location = '" + path + "'", 250);
        }
    } else {
        Control.WriteDetailedLog("`1001`" + path);
        this.ContentFrame.location = path;
    }
}

function ScoLoader_FindContentFrame(wnd) {
    var _198 = null;
    for (var i = 0; i < wnd.frames.length; i++) {
        if (wnd.frames[i].name == IntegrationImplementation.CONTENT_FRAME_NAME) {
            _198 = wnd.frames[i];
            return _198;
        }
        _198 = ScoLoader_FindContentFrame(wnd.frames[i]);
        if (_198 !== null) {
            return _198;
        }
    }
    return null;
}

function ScoLoader_ConstructPreviewAiccSid(_19a) {
    var _19b = RegistrationToDeliver.Package.Id;
    var _19c;
    if (_19b.length < 10) {
        _19c = "0" + _19b.length.toString();
    } else {
        _19c = _19b.length.toString();
    }
    var _19d = _19a.ScormObjectDatabaseId;
    var _19e;
    if (_19d.length < 10) {
        _19e = "0" + _19d.length.toString();
    } else {
        _19e = _19d.length.toString();
    }
    var _19f = "PREVIEW" + _19c + _19b + _19e + _19d;
    return _19f;
}
var HUNDREDTHS_PER_SECOND = 100;
var HUNDREDTHS_PER_MINUTE = HUNDREDTHS_PER_SECOND * 60;
var HUNDREDTHS_PER_HOUR = HUNDREDTHS_PER_MINUTE * 60;
var HUNDREDTHS_PER_DAY = HUNDREDTHS_PER_HOUR * 24;
var HUNDREDTHS_PER_MONTH = HUNDREDTHS_PER_DAY * (((365 * 4) + 1) / 48);
var HUNDREDTHS_PER_YEAR = HUNDREDTHS_PER_MONTH * 12;
var REG_EX_DIGITS = /\d+/g;
var REG_EX_CHILDREN = /._children$/;
var REG_EX_COUNT = /._count$/;

function ConvertIso8601TimeToUtcAnsiSql(_1a0) {
    var _1a1 = GetParsedIso8601Time(_1a0);
    var date = new Date();
    if (_1a1["timezoneoffsetchar"] === "" || _1a1["timezoneoffsetchar"] === null || _1a1["timezoneoffsetchar"] === undefined) {
        date.setFullYear(_1a1["year"]);
        date.setMonth(_1a1["month"] - 1);
        date.setDate(_1a1["day"]);
        date.setHours(_1a1["hours"]);
        date.setMinutes(_1a1["minutes"]);
        date.setSeconds(_1a1["seconds"]);
        date.setMilliseconds(_1a1["milliseconds"]);
    } else {
        date.setUTCFullYear(_1a1["year"]);
        date.setUTCMonth(_1a1["month"] - 1);
        date.setUTCDate(_1a1["day"]);
        date.setUTCHours(_1a1["hours"]);
        date.setUTCMinutes(_1a1["minutes"]);
        date.setUTCSeconds(_1a1["seconds"]);
        date.setUTCMilliseconds(_1a1["milliseconds"]);
        if (_1a1["timezoneoffsetchar"] == "-") {
            date.setUTCHours(date.getUTCHours() + new Number(_1a1["offsethours"]));
            date.setUTCMinutes(date.getUTCMinutes() + new Number(_1a1["offsetminutes"]));
        } else {
            if (_1a1["timezoneoffsetchar"] == "+") {
                date.setUTCHours(date.getUTCHours() - new Number(_1a1["offsethours"]));
                date.setUTCMinutes(date.getUTCMinutes() - new Number(_1a1["offsetminutes"]));
            }
        }
    }
    var _1a3 = date.getUTCFullYear() + "-" + ZeroPad(date.getUTCMonth() + 1, 2) + "-" + ZeroPad(date.getUTCDate(), 2) + "T" + ZeroPad(date.getUTCHours(), 2) + ":" + ZeroPad(date.getUTCMinutes(), 2) + ":" + ZeroPad(date.getUTCSeconds(), 2);
    return _1a3;
}

function ConvertDateToIso8601String(date) {
    var _1a5 = function(num) {
        return ((num < 10) ? "0" : "") + num;
    };
    var str = "";
    str += date.getUTCFullYear();
    str += "-" + _1a5(date.getUTCMonth() + 1);
    str += "-" + _1a5(date.getUTCDate());
    str += "T" + _1a5(date.getUTCHours()) + ":" + _1a5(date.getUTCMinutes());
    str += ":" + _1a5(date.getUTCSeconds()) + ".";
    var _1a8 = ("00" + date.getUTCMilliseconds().toString());
    str += _1a8.substr(_1a8.length - 3, 2);
    str += "Z";
    return str;
}

function GetParsedIso8601Time(_1a9) {
    var _1aa = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d*))?)?)?((?:([+-])(\d{2})(?::(\d{2}))?)|Z)?)?$/;
    var _1ab = _1aa.exec(_1a9);
    var _1ac = {};
    _1ac.year = "";
    _1ac.month = "";
    _1ac.day = "";
    _1ac.hours = "";
    _1ac.minutes = "";
    _1ac.seconds = "";
    _1ac.milliseconds = "";
    _1ac.timezoneoffsetchar = "";
    _1ac.offsethours = "";
    _1ac.offsetminutes = "";
    if (!_1ab) {
        Debug.AssertError("ERROR - unable to recognize the date format '" + _1a9 + "'.");
        return _1ac;
    }
    _1ac.year = _1ab[1] || "";
    _1ac.month = _1ab[2] || "";
    _1ac.day = _1ab[3] || "";
    _1ac.hours = _1ab[4] || "";
    _1ac.minutes = _1ab[5] || "";
    _1ac.seconds = _1ab[6] || "";
    _1ac.milliseconds = ((_1ab[7] || "") + "000").substring(0, 3);
    var _1ad = _1ab[8];
    if (_1ad && _1ad == "Z") {
        _1ac.timezoneoffsetchar = "Z";
    }
    if (_1ad && _1ad != "Z") {
        _1ac.timezoneoffsetchar = _1ab[9] || "";
        _1ac.offsethours = _1ab[10] || "";
        _1ac.offsetminutes = _1ab[11] || "";
    }
    return _1ac;
}

function GetDateFromUtcIso8601Time(_1ae) {
    var _1af = GetParsedIso8601Time(_1ae);
    Debug.AssertError("Expected " + _1ae + " to be a UTC string", _1af.timezoneoffsetchar !== "Z");
    var _1b0 = new Date();
    _1b0.setUTCFullYear(_1af.year);
    _1b0.setUTCMonth(_1af.month - 1);
    _1b0.setUTCDate(_1af.day);
    _1b0.setUTCHours(_1af.hours);
    _1b0.setUTCMinutes(_1af.minutes);
    _1b0.setUTCSeconds(_1af.seconds);
    _1b0.setUTCMilliseconds(_1af.milliseconds);
    return _1b0;
}

function ConvertIso8601TimeSpanToCmiTimeSpan(_1b1) {
    var _1b2 = ConvertIso8601TimeSpanToHundredths(_1b1);
    var _1b3 = ConvertHundredthsIntoSCORMTime(_1b2);
    return _1b3;
}

function ConvertCmiTimeSpanToIso8601TimeSpan(_1b4) {
    var _1b5 = ConvertCmiTimeSpanToHundredths(_1b4);
    var _1b6 = ConvertHundredthsToIso8601TimeSpan(_1b5);
    return _1b6;
}

function ConvertCmiTimeToIso8601Time(_1b7) {
    dtmNow = new Date();
    var year = dtmNow.getFullYear();
    var _1b9 = dtmNow.getMonth();
    var day = dtmNow.getDate();
    year = ZeroPad(year, 4);
    _1b9 = ZeroPad((_1b9 + 1), 2);
    day = ZeroPad(day, 2);
    var _1bb = year + "-" + _1b9 + "-" + day + "T" + _1b7;
    return _1bb;
}

function ConvertCmiTimeSpanToHundredths(_1bc) {
    if (_1bc === "") {
        return 0;
    }
    var _1bd;
    var _1be;
    var _1bf;
    var _1c0;
    var _1c1;
    _1bd = _1bc.split(":");
    _1be = _1bd[0];
    _1bf = _1bd[1];
    _1c0 = _1bd[2];
    intTotalHundredths = (_1be * 360000) + (_1bf * 6000) + (_1c0 * 100);
    intTotalHundredths = Math.round(intTotalHundredths);
    return intTotalHundredths;
}

function ConvertIso8601TimeSpanToHundredths(_1c2) {
    if (_1c2 === "") {
        return 0;
    }
    var _1c3 = 0;
    var _1c4;
    var _1c5;
    var _1c6;
    var _1c7 = 0;
    var _1c8 = 0;
    var _1c9 = 0;
    var Days = 0;
    var _1cb = 0;
    var _1cc = 0;
    _1c2 = new String(_1c2);
    _1c4 = "";
    _1c5 = "";
    _1c6 = false;
    for (var i = 1; i < _1c2.length; i++) {
        _1c5 = _1c2.charAt(i);
        if (IsIso8601SectionDelimiter(_1c5)) {
            switch (_1c5.toUpperCase()) {
                case "Y":
                    _1cc = parseInt(_1c4, 10);
                    break;
                case "M":
                    if (_1c6) {
                        _1c8 = parseInt(_1c4, 10);
                    } else {
                        _1cb = parseInt(_1c4, 10);
                    }
                    break;
                case "D":
                    Days = parseInt(_1c4, 10);
                    break;
                case "H":
                    _1c9 = parseInt(_1c4, 10);
                    break;
                case "S":
                    _1c7 = parseFloat(_1c4);
                    break;
                case "T":
                    _1c6 = true;
                    break;
            }
            _1c4 = "";
        } else {
            _1c4 += "" + _1c5;
        }
    }
    _1c3 = (_1cc * HUNDREDTHS_PER_YEAR) + (_1cb * HUNDREDTHS_PER_MONTH) + (Days * HUNDREDTHS_PER_DAY) + (_1c9 * HUNDREDTHS_PER_HOUR) + (_1c8 * HUNDREDTHS_PER_MINUTE) + (_1c7 * HUNDREDTHS_PER_SECOND);
    _1c3 = Math.round(_1c3);
    return _1c3;
}

function IsIso8601SectionDelimiter(str) {
    if (str.search(/[PYMDTHS]/) >= 0) {
        return true;
    } else {
        return false;
    }
}

function ConvertHundredthsToIso8601TimeSpan(_1cf) {
    var _1d0 = "";
    var _1d1;
    var _1d2;
    var _1d3;
    var _1d4;
    var Days;
    var _1d6;
    var _1d7;
    _1d1 = _1cf;
    _1d7 = Math.floor(_1d1 / HUNDREDTHS_PER_YEAR);
    _1d1 -= (_1d7 * HUNDREDTHS_PER_YEAR);
    _1d6 = Math.floor(_1d1 / HUNDREDTHS_PER_MONTH);
    _1d1 -= (_1d6 * HUNDREDTHS_PER_MONTH);
    Days = Math.floor(_1d1 / HUNDREDTHS_PER_DAY);
    _1d1 -= (Days * HUNDREDTHS_PER_DAY);
    _1d4 = Math.floor(_1d1 / HUNDREDTHS_PER_HOUR);
    _1d1 -= (_1d4 * HUNDREDTHS_PER_HOUR);
    _1d3 = Math.floor(_1d1 / HUNDREDTHS_PER_MINUTE);
    _1d1 -= (_1d3 * HUNDREDTHS_PER_MINUTE);
    _1d2 = Math.floor(_1d1 / HUNDREDTHS_PER_SECOND);
    _1d1 -= (_1d2 * HUNDREDTHS_PER_SECOND);
    if (_1d7 > 0) {
        _1d0 += _1d7 + "Y";
    }
    if (_1d0 > 0) {
        ScormTime += _1d6 + "M";
    }
    if (Days > 0) {
        _1d0 += Days + "D";
    }
    if ((_1d1 + _1d2 + _1d3 + _1d4) > 0) {
        _1d0 += "T";
        if (_1d4 > 0) {
            _1d0 += _1d4 + "H";
        }
        if (_1d3 > 0) {
            _1d0 += _1d3 + "M";
        }
        if ((_1d1 + _1d2) > 0) {
            _1d0 += _1d2;
            if (_1d1 > 0) {
                _1d0 += "." + _1d1;
            }
            _1d0 += "S";
        }
    }
    if (_1d0 === "") {
        _1d0 = "T0H0M0S";
    }
    _1d0 = "P" + _1d0;
    return _1d0;
}

function ConvertHundredthsIntoSCORMTime(_1d8) {
    var _1d9;
    var _1da;
    var _1db;
    var _1dc;
    intTotalMilliseconds = (_1d8 * 10);
    var _1dd;
    _1dc = intTotalMilliseconds % 1000;
    _1db = ((intTotalMilliseconds - _1dc) / 1000) % 60;
    intMinutes = ((intTotalMilliseconds - _1dc - (_1db * 1000)) / 60000) % 60;
    _1d9 = (intTotalMilliseconds - _1dc - (_1db * 1000) - (intMinutes * 60000)) / 3600000;
    if (_1d9 == 10000) {
        _1d9 = 9999;
        intMinutes = (intTotalMilliseconds - (_1d9 * 3600000)) / 60000;
        if (intMinutes == 100) {
            intMinutes = 99;
        }
        intMinutes = Math.floor(intMinutes);
        _1db = (intTotalMilliseconds - (_1d9 * 3600000) - (intMinutes * 60000)) / 1000;
        if (_1db == 100) {
            _1db = 99;
        }
        _1db = Math.floor(_1db);
        _1dc = (intTotalMilliseconds - (_1d9 * 3600000) - (intMinutes * 60000) - (_1db * 1000));
    }
    intHundredths = Math.floor(_1dc / 10);
    _1dd = ZeroPad(_1d9, 4) + ":" + ZeroPad(intMinutes, 2) + ":" + ZeroPad(_1db, 2) + "." + intHundredths;
    if (_1d9 > 9999) {
        _1dd = "9999:99:99.99";
    }
    return _1dd;
}

function RemoveIndiciesFromCmiElement(_1de) {
    return _1de.replace(REG_EX_DIGITS, "n");
}

function ExtractIndex(_1df) {
    var _1e0 = "";
    var _1e1;
    _1e1 = _1df.match(/\.\d+\./);
    if (_1e1 !== null && _1e1.length > 0) {
        _1e0 = _1e1[0].replace(/\./g, "");
        _1e0 = parseInt(_1e0, 10);
    }
    return _1e0;
}

function ExtractSecondaryIndex(_1e2) {
    var _1e3 = "";
    var _1e4;
    _1e4 = _1e2.match(/\.\d+\./g);
    if (_1e4 !== null && _1e4.length > 1) {
        _1e3 = _1e4[1].replace(/\./g, "");
        _1e3 = parseInt(_1e3, 10);
    }
    return _1e3;
}

function TranslateDualStausToSingleStatus(_1e5, _1e6) {
    var _1e7 = null;
    switch (_1e6) {
        case (SCORM_STATUS_PASSED):
            _1e7 = SCORM_STATUS_PASSED;
            break;
        case (SCORM_STATUS_FAILED):
            _1e7 = SCORM_STATUS_FAILED;
            break;
        case (SCORM_STATUS_UNKNOWN):
            if (_1e5 == SCORM_STATUS_COMPLETED) {
                _1e7 = SCORM_STATUS_COMPLETED;
            } else {
                if (_1e5 == SCORM_STATUS_INCOMPLETE) {
                    _1e7 = SCORM_STATUS_INCOMPLETE;
                } else {
                    if (_1e5 == SCORM_STATUS_UNKNOWN || _1e5 == SCORM_STATUS_NOT_ATTEMPTED) {
                        _1e7 = SCORM_STATUS_NOT_ATTEMPTED;
                    } else {
                        if (_1e5 == SCORM_STATUS_BROWSED) {
                            _1e7 = SCORM_STATUS_BROWSED;
                        }
                    }
                }
            }
            break;
    }
    if (_1e7 === null) {
        Debug.AssertError("Invalid status combination encountered in GetValue - Success = " + _1e6 + ", Completion = " + _1e5);
        return "";
    } else {
        return _1e7;
    }
}

function TranslateSingleStatusIntoSuccess(_1e8) {
    var _1e9;
    switch (_1e8) {
        case (SCORM_STATUS_PASSED):
            _1e9 = SCORM_STATUS_PASSED;
            break;
        case (SCORM_STATUS_COMPLETED):
            _1e9 = SCORM_STATUS_UNKNOWN;
            break;
        case (SCORM_STATUS_FAILED):
            _1e9 = SCORM_STATUS_FAILED;
            break;
        case (SCORM_STATUS_INCOMPLETE):
            _1e9 = SCORM_STATUS_UNKNOWN;
            break;
        case (SCORM_STATUS_BROWSED):
            _1e9 = SCORM_STATUS_UNKNOWN;
            break;
        case (SCORM_STATUS_NOT_ATTEMPTED):
            _1e9 = SCORM_STATUS_UNKNOWN;
            break;
        default:
            Debug.AssertError("Unrecognized single status");
    }
    return _1e9;
}

function TranslateSingleStatusIntoCompletion(_1ea) {
    var _1eb;
    switch (_1ea) {
        case (SCORM_STATUS_PASSED):
            _1eb = SCORM_STATUS_COMPLETED;
            break;
        case (SCORM_STATUS_COMPLETED):
            _1eb = SCORM_STATUS_COMPLETED;
            break;
        case (SCORM_STATUS_FAILED):
            if (Control.Package.Properties.CompletionStatOfFailedSuccessStat === SCORM_STATUS_COMPLETED || Control.Package.Properties.CompletionStatOfFailedSuccessStat === SCORM_STATUS_INCOMPLETE) {
                _1eb = Control.Package.Properties.CompletionStatOfFailedSuccessStat;
            } else {
                _1eb = SCORM_STATUS_COMPLETED;
            }
            break;
        case (SCORM_STATUS_INCOMPLETE):
            _1eb = SCORM_STATUS_INCOMPLETE;
            break;
        case (SCORM_STATUS_BROWSED):
            _1eb = SCORM_STATUS_BROWSED;
            break;
        case (SCORM_STATUS_NOT_ATTEMPTED):
            _1eb = SCORM_STATUS_NOT_ATTEMPTED;
            break;
        default:
            Debug.AssertError("Unrecognized single status");
    }
    return _1eb;
}

function IsValidCMITimeSpan(_1ec) {
    var _1ed = /^\d?\d?\d\d:\d\d:\d\d(.\d\d?)?$/;
    if (_1ec.search(_1ed) > -1) {
        return true;
    } else {
        return false;
    }
}

function IsValidCMIDecimal(_1ee) {
    if (_1ee.search(/[^.\d-]/) > -1) {
        return false;
    }
    if (_1ee.search("-") > -1) {
        if (_1ee.indexOf("-", 1) > -1) {
            return false;
        }
    }
    if (_1ee.indexOf(".") != _1ee.lastIndexOf(".")) {
        return false;
    }
    if (_1ee.search(/\d/) < 0) {
        return false;
    }
    return true;
}

function IsValidCMIIdentifier(_1ef) {
    if (_1ef.length > 255) {
        return false;
    }
    if (_1ef === "") {
        return false;
    }
    return true;
}

function IsValidCMISInteger(_1f0) {
    if (_1f0.search(/[^\d-]/) > -1) {
        return false;
    }
    if (_1f0.search("-") > -1) {
        if (_1f0.indexOf("-", 1) > -1) {
            return false;
        }
    }
    if (_1f0.search(/\d/) < 0) {
        return false;
    }
    _1f0 = parseInt(_1f0, 10);
    if (_1f0 < -32768 || _1f0 > 32768) {
        return false;
    }
    return true;
}

function IsValidCMITime(_1f1) {
    var _1f2 = /^\d\d:\d\d:\d\d(.\d\d?)?$/;
    var _1f3;
    var _1f4;
    var _1f5;
    var _1f6;
    var _1f7;
    var _1f8 = 0;
    if (_1f1.search(_1f2) < 0) {
        return false;
    }
    _1f3 = _1f1.split(":");
    _1f4 = _1f3[0];
    _1f5 = _1f3[1];
    _1f6 = _1f3[2].split(".");
    _1f7 = _1f6[0];
    if (_1f6.length > 1) {
        _1f8 = _1f6[1];
    }
    if (_1f4 < 0 || _1f4 > 23) {
        return false;
    }
    if (_1f5 < 0 || _1f5 > 59) {
        return false;
    }
    if (_1f7 < 0 || _1f7 > 59) {
        return false;
    }
    if (_1f8 < 0 || _1f8 > 99) {
        return false;
    }
    return true;
}

function IsValidCMIFeedback(_1f9, _1fa) {
    if (_1fa.length > 4096) {
        return false;
    }
    if (RegistrationToDeliver.Package.Properties.ValidateInteractionResponses) {
        _1fa = _1fa.toLowerCase();
        switch (_1f9) {
            case "true-false":
                if (_1fa.search(/^[01tf]/) !== 0) {
                    return false;
                }
                break;
            case "choice":
                if (_1fa.search(/(^(([a-z0-9])|(([a-z0-9]\,)+[a-z0-9]))$)|(^\{(([a-z0-9])|(([a-z0-9]\,)+[a-z0-9]))\}$)/) !== 0) {
                    return false;
                }
                break;
            case "fill-in":
                if (_1fa.length > 255) {
                    return false;
                }
                break;
            case "numeric":
                if (!IsValidCMIDecimal(_1fa)) {
                    return false;
                }
                break;
            case "likert":
                break;
            case "matching":
                if (_1fa.search(/(^[0-9a-z]\.[0-9a-z]$)|(^([0-9a-z]\.[0-9a-z]\,)+([0-9a-z]\.[0-9a-z])$)|(^\{[0-9a-z]\.[0-9a-z]\}$)|(^\{([0-9a-z]\.[0-9a-z]\,)+([0-9a-z]\.[0-9a-z])\}$)/) !== 0) {
                    return false;
                }
                break;
            case "performance":
                if (_1fa.length > 255) {
                    return false;
                }
                break;
            case "sequencing":
                if (_1fa.search(/(^[a-z0-9]$)|(^([a-z0-9]\,)+[a-z0-9]$)/) !== 0) {
                    return false;
                }
                break;
            default:
                break;
        }
    }
    return true;
}

function NormalizeRawScore(_1fb, _1fc, _1fd) {
    var _1fe = null;
    if (_1fc !== null && _1fc !== undefined) {
        _1fc = parseFloat(_1fc);
    }
    if (_1fd !== null && _1fd !== undefined) {
        _1fd = parseFloat(_1fd);
    }
    if (_1fb !== null && _1fb !== undefined) {
        _1fb = parseFloat(_1fb);
        if (_1fc !== null && _1fc !== undefined && _1fd !== null && _1fd !== undefined && _1fb >= _1fc && _1fb <= _1fd) {
            if (_1fc == _1fd) {
                if (_1fb == 0) {
                    _1fe = 0;
                } else {
                    _1fe = 1;
                }
            } else {
                _1fe = ((_1fb - _1fc) / (_1fd - _1fc));
            }
        } else {
            if (_1fb >= 0 && _1fb <= 100) {
                _1fe = (_1fb / 100);
            }
        }
    }
    if (_1fe !== null) {
        return RoundToPrecision(_1fe, 7);
    } else {
        return null;
    }
}

function ServerFormater() {}
ServerFormater.prototype.ConvertBoolean = ServerFormater_ConvertBoolean;
ServerFormater.prototype.ConvertCompletionStatus = ServerFormater_ConvertCompletionStatus;
ServerFormater.prototype.ConvertCredit = ServerFormater_ConvertCredit;
ServerFormater.prototype.ConvertEntry = ServerFormater_ConvertEntry;
ServerFormater.prototype.ConvertExit = ServerFormater_ConvertExit;
ServerFormater.prototype.ConvertMode = ServerFormater_ConvertMode;
ServerFormater.prototype.ConvertSuccessStatus = ServerFormater_ConvertSuccessStatus;
ServerFormater.prototype.ConvertInteractionType = ServerFormater_ConvertInteractionType;
ServerFormater.prototype.ConvertInteractionResult = ServerFormater_ConvertInteractionResult;
ServerFormater.prototype.GetNumericInteractionResultId = ServerFormater_GetNumericInteractionResultId;
ServerFormater.prototype.ConvertTimeSpan = ServerFormater_ConvertTimeSpan;
ServerFormater.prototype.ConvertTime = ServerFormater_ConvertTime;
ServerFormater.prototype.ConvertSSPAllocationSuccess = ServerFormater_ConvertSSPAllocationSuccess;
ServerFormater.prototype.ConvertSSPPersistence = ServerFormater_ConvertSSPPersistence;
ServerFormater.prototype.TrimToLength = ServerFormater_TrimToLength;

function ServerFormater_ConvertBoolean(_1ff) {
    var _200;
    if (_1ff === true) {
        _200 = "1";
    } else {
        if (_1ff === false) {
            _200 = "0";
        } else {
            Debug.AssertError("Value is not a boolean");
        }
    }
    return _200;
}

function ServerFormater_ConvertCompletionStatus(_201) {
    var _202 = null;
    switch (_201) {
        case (SCORM_STATUS_UNKNOWN):
            _202 = 1;
            break;
        case (SCORM_STATUS_COMPLETED):
            _202 = 2;
            break;
        case (SCORM_STATUS_INCOMPLETE):
            _202 = 3;
            break;
        case (SCORM_STATUS_BROWSED):
            _202 = 4;
            break;
        case (SCORM_STATUS_NOT_ATTEMPTED):
            _202 = 5;
            break;
        default:
            Debug.AssertError("Unrecognized Completion Status Value");
            _202 = -1;
            break;
    }
    return _202;
}

function ServerFormater_ConvertCredit(_203) {
    var _204 = null;
    switch (_203) {
        case (SCORM_CREDIT):
            _204 = 1;
            break;
        case (SCORM_CREDIT_NO):
            _204 = 2;
            break;
        default:
            Debug.AssertError("Unrecognized Credit Value");
            _204 = -1;
            break;
    }
    return _204;
}

function ServerFormater_ConvertEntry(_205) {
    var _206 = null;
    switch (_205) {
        case (SCORM_ENTRY_AB_INITO):
            _206 = 1;
            break;
        case (SCORM_ENTRY_RESUME):
            _206 = 2;
            break;
        case (SCORM_ENTRY_NORMAL):
            _206 = 3;
            break;
        default:
            Debug.AssertError("Unrecognized Entry Value");
            _206 = -1;
            break;
    }
    return _206;
}

function ServerFormater_ConvertExit(_207) {
    var _208 = null;
    switch (_207) {
        case (SCORM_EXIT_TIME_OUT):
            _208 = 1;
            break;
        case (SCORM_EXIT_SUSPEND):
            _208 = 2;
            break;
        case (SCORM_EXIT_LOGOUT):
            _208 = 3;
            break;
        case (SCORM_EXIT_NORMAL):
            _208 = 4;
            break;
        case (SCORM_EXIT_UNKNOWN):
            _208 = 5;
            break;
        default:
            Debug.AssertError("Unrecognized Exit Value");
            _208 = -1;
            break;
    }
    return _208;
}

function ServerFormater_ConvertMode(_209) {
    var _20a = null;
    switch (_209) {
        case (SCORM_MODE_NORMAL):
            _20a = 1;
            break;
        case (SCORM_MODE_BROWSE):
            _20a = 2;
            break;
        case (SCORM_MODE_REVIEW):
            _20a = 3;
            break;
        default:
            Debug.AssertError("Unrecognized Mode Value");
            _20a = -1;
            break;
    }
    return _20a;
}

function ServerFormater_ConvertSuccessStatus(_20b) {
    var _20c = null;
    switch (_20b) {
        case (SCORM_STATUS_UNKNOWN):
            _20c = 1;
            break;
        case (SCORM_STATUS_PASSED):
            _20c = 2;
            break;
        case (SCORM_STATUS_FAILED):
            _20c = 3;
            break;
        default:
            Debug.AssertError("Unrecognized Success Status Value");
            _20c = -1;
            break;
    }
    return _20c;
}

function ServerFormater_ConvertInteractionType(_20d) {
    var _20e = null;
    switch (_20d) {
        case (SCORM_TRUE_FALSE):
            _20e = 1;
            break;
        case (SCORM_CHOICE):
            _20e = 2;
            break;
        case (SCORM_FILL_IN):
            _20e = 3;
            break;
        case (SCORM_MATCHING):
            _20e = 6;
            break;
        case (SCORM_PERFORMANCE):
            _20e = 7;
            break;
        case (SCORM_SEQUENCING):
            _20e = 8;
            break;
        case (SCORM_LIKERT):
            _20e = 5;
            break;
        case (SCORM_NUMERIC):
            _20e = 9;
            break;
        case (SCORM_LONG_FILL_IN):
            _20e = 4;
            break;
        case (SCORM_OTHER):
            _20e = 10;
            break;
        default:
            Debug.AssertError("Unrecognized Interaction Type Value");
            _20e = -1;
            break;
    }
    return _20e;
}

function ServerFormater_ConvertInteractionResult(_20f) {
    var _210 = null;
    switch (_20f) {
        case (SCORM_CORRECT):
            _210 = 1;
            break;
        case (SCORM_UNANTICIPATED):
            _210 = 3;
            break;
        case (SCORM_INCORRECT):
            _210 = 2;
            break;
        case (SCORM_NEUTRAL):
            _210 = 4;
            break;
        default:
            Debug.AssertError("Unrecognized Interaction Result Value");
            _210 = -1;
            break;
    }
    return _210;
}

function ServerFormater_GetNumericInteractionResultId() {
    return 5;
}

function ServerFormater_ConvertTimeSpan(_211) {
    return ConvertIso8601TimeSpanToHundredths(_211);
}

function ServerFormater_ConvertTime(_212) {
    return ConvertIso8601TimeToUtcAnsiSql(_212);
}

function ServerFormater_ConvertSSPAllocationSuccess(_213) {
    var _214 = null;
    switch (_213) {
        case (SSP_ALLOCATION_SUCCESS_FAILURE):
            _214 = 3;
            break;
        case (SSP_ALLOCATION_SUCCESS_MINIMUM):
            _214 = 1;
            break;
        case (SSP_ALLOCATION_SUCCESS_REQUESTED):
            _214 = 2;
            break;
        case (SSP_ALLOCATION_SUCCESS_NOT_ATTEMPTED):
            _214 = 4;
            break;
        default:
            Debug.AssertError("Unrecognized SSPAllocationSuccess Value");
            _214 = -1;
            break;
    }
    return _214;
}

function ServerFormater_ConvertSSPPersistence(_215) {
    var _216 = null;
    switch (_215) {
        case (SSP_PERSISTENCE_LEARNER):
            _216 = 1;
            break;
        case (SSP_PERSISTENCE_COURSE):
            _216 = 2;
            break;
        case (SSP_PERSISTENCE_SESSION):
            _216 = 3;
            break;
        default:
            Debug.AssertError("Unrecognized SSPPersistence Value");
            _216 = -1;
            break;
    }
    return _216;
}

function ServerFormater_TrimToLength(str, len) {
    if (str !== null && str.length > len) {
        str = str.substr(0, len);
    }
    return str;
}

function StringBuilder(_219) {
    if (_219 !== null && parseInt(_219, 10) > 0) {
        this.Contents = new Array(parseInt(_219, 10));
    } else {
        this.Contents = new Array();
    }
    this.CurrentEntry = 0;
}
StringBuilder.prototype.Append = StringBuilder_Append;
StringBuilder.prototype.AppendLine = StringBuilder_AppendLine;
StringBuilder.prototype.toString = StringBuilder_toString;

function StringBuilder_Append(str) {
    this.Contents[this.CurrentEntry] = str;
    this.CurrentEntry++;
}

function StringBuilder_AppendLine(str) {
    this.Append(str + "\r\n");
}

function StringBuilder_toString() {
    return this.Contents.join("").trim();
}
String.prototype.trim = String_Trim;
String.prototype.toBoolean = String_ToBoolean;

function String_Trim() {
    return Trim(this);
}

function Trim(str) {
    str = str.replace(/^\s*/, "");
    str = str.replace(/\s*$/, "");
    return str;
}

function String_ToBoolean() {
    var str = this;
    var _21e;
    str = new String(str).toLowerCase();
    if (str == "1" || str.charAt(0) == "t") {
        _21e = true;
    } else {
        if (str == "0" || str.charAt(0) == "f") {
            _21e = false;
        } else {
            Debug.AssertError("Value '" + str + "' can not be converted to a boolean.");
        }
    }
    return _21e;
}

function MergeQueryStringParameters() {
    var _21f = new Array();
    var _220 = new Array();
    var url = null;
    var _222 = null;
    var i;
    var _224 = 0;
    var _225 = null;
    for (i = 0; i < arguments.length; i++) {
        if (arguments[i] != null && arguments[i].length > 0) {
            _224++;
            if (_225 == null) {
                _225 = arguments[i];
            }
        }
    }
    if (_224 == 1) {
        return _225;
    }
    for (i = 0; i < arguments.length; i++) {
        var qs = arguments[i];
        qs = new String(qs);
        if (qs.indexOf("#") > -1) {
            if (qs.charAt(0) == "#") {
                if (_222 === null) {
                    _222 = qs.substring(1);
                }
                qs = "";
            } else {
                var _227 = qs.split("#");
                if (_222 === null) {
                    _222 = _227[1];
                }
                qs = _227[0];
            }
        }
        if (qs.indexOf("?") > 0) {
            var _228 = qs.substring(0, qs.indexOf("?"));
            var _229 = qs.substring(qs.indexOf("?") + 1, qs.length);
            if (url === null) {
                url = _228;
            }
            qs = _229;
        }
        if (qs.indexOf("#") < 0 && qs.indexOf("=") < 0 && qs.indexOf("?") < 0 && (qs.indexOf("&") < 0 || (qs.indexOf("&") > 0 && qs.indexOf(".") > 0))) {
            if (url === null) {
                url = qs;
            }
            qs = "";
        }
        if (qs.charAt(0) == "?") {
            qs = qs.substring(1);
        }
        if (qs.charAt(0) == "&") {
            qs = qs.substring(1);
        }
        if (qs.indexOf("&") > -1) {
            var _22a = qs.split("&");
            for (var j = 0; j < _22a.length; j++) {
                AddQueryStringParm(_21f, _220, _22a[j]);
            }
        } else {
            if (qs.length > 0) {
                AddQueryStringParm(_21f, _220, qs);
            }
        }
    }
    var _22c = "";
    if (url !== null) {
        _22c += url;
    }
    var _22d = true;
    for (i = 0; i < _21f.length; i++) {
        if (_22d) {
            _22c += "?";
            _22d = false;
        } else {
            _22c += "&";
        }
        _22c += _21f[i];
        var _22e = _220[i];
        if (_22e != null) {
            _22c += "=" + _22e;
        }
    }
    if (_222 !== null) {
        _22c += "#" + _222;
    }
    return _22c;
}

function AddQueryStringParm(_22f, _230, _231) {
    if (_231.indexOf("=") > -1) {
        var parm = _231.split("=");
        var name = parm[0];
        var _234 = parm[1];
        _22f[_22f.length] = name;
        _230[_230.length] = _234;
    } else {
        _22f[_22f.length] = _231;
        _230[_230.length] = null;
    }
}

function CleanExternalString(str) {
    str = str + "";
    str = new String(str);
    str = str.toString();
    str = unescape(escape(str));
    return str;
}

function ZeroPad(num, _237) {
    var _238;
    var _239;
    var i;
    _238 = new String(num);
    _239 = _238.length;
    if (_239 > _237) {
        _238 = _238.substr(0, _237);
    } else {
        for (i = _239; i < _237; i++) {
            _238 = "0" + _238;
        }
    }
    return _238;
}

function RoundToPrecision(_23b, _23c) {
    return Math.round(_23b * Math.pow(10, _23c)) / Math.pow(10, _23c);
}

function GetErrorDetailString(_23d) {
    var _23e = [];
    if (typeof navigator != "undefined") {
        if (typeof navigator.userAgent != "undefined") {
            _23e.push("User Agent: " + navigator.userAgent);
        }
        if (typeof navigator.platform != "undefined") {
            _23e.push("Platform: " + navigator.platform);
        }
    } else {
        _23e.push("No browser information was available (via the global navigator object)");
    }
    if (typeof _23d.name != "undefined") {
        _23e.push("Name: " + _23d.name);
    }
    if (typeof _23d.message != "undefined") {
        _23e.push("Message: " + _23d.message);
    }
    if (typeof _23d.description != "undefined") {
        _23e.push("Description: " + _23d.description);
    }
    if (typeof _23d.number != "undefined") {
        _23e.push("Number: " + _23d.number);
    }
    if (typeof _23d.fileName != "undefined") {
        _23e.push("Filename: " + _23d.fileName);
    }
    if (typeof _23d.lineNumber != "undefined") {
        _23e.push("Linenumber: " + _23d.lineNumber);
    }
    if (typeof _23d.toString != "undefined") {
        _23e.push("toString(): " + _23d.toString());
    }
    try {
        var _23f = printStackTrace({
            e: _23d
        });
        _23e.push("StackTrace: " + _23f.join("  -->  "));
    } catch (error2) {
        _23e.push("StackTrace: [Error fetching stack trace]");
    }
    return _23e.join(", ");
}

function SetCookie(_240, _241, _242) {
    var d = new Date();
    d.setTime(d.getTime() + (_242 * 24 * 60 * 60 * 1000));
    var _244 = "expires=" + d.toGMTString();
    document.cookie = _240 + "=" + _241 + "; " + _244;
}

function XmlElement(_245) {
    this.ElementName = _245;
    this.Attributes = new Array();
    this.Elements = new Array();
}
XmlElement.prototype.AddAttribute = XmlElement_AddAttribute;
XmlElement.prototype.AddElement = XmlElement_AddElement;
XmlElement.prototype.Encode = XmlElement_Encode;
XmlElement.prototype.toString = XmlElement_toString;

function XmlElement_AddAttribute(_246, _247) {
    this.Attributes[_246] = this.Encode(_247);
}

function XmlElement_AddElement(_248) {
    this.Elements[this.Elements.length] = _248;
}

function XmlElement_toString() {
    var xml = new StringBuilder(this.Attributes.length + this.Elements.length + 2);
    xml.Append("<" + this.ElementName + " ");
    for (var _24a in this.Attributes) {
        xml.Append(_24a + "=\"" + this.Attributes[_24a] + "\" ");
    }
    if (this.Elements.length > 0) {
        xml.AppendLine(">");
        for (var i = 0; i < this.Elements.length; i++) {
            xml.AppendLine(this.Elements[i]);
        }
        xml.AppendLine("</" + this.ElementName + ">");
    } else {
        xml.AppendLine("/>");
    }
    return xml.toString().trim();
}

function XmlElement_Encode(str) {
    str = new String(str);
    if (str !== null) {
        str = str.replace(/\&/g, "&amp;");
        str = str.replace(/\</g, "&lt;");
        str = str.replace(/\>/g, "&gt;");
        str = str.replace(/\'/g, "&apos;");
        str = str.replace(/\"/g, "&quot;");
        if ("a".replace(/a/, function() {
                return "";
            }).length == 0) {
            str = str.replace(/(\w|\W)/g, XmlElement_CharacterEscape);
        } else {
            str = EscapeCharacters(str);
        }
    }
    return str;
}

function XmlElement_CharacterEscape(s, _24e) {
    var _24f = _24e.charCodeAt(0);
    _24f = new Number(_24f);
    if (_24f > 127) {
        return "&#x" + _24f.toString(16) + ";";
    } else {
        if (_24f < 32) {
            return "&amp;#x" + _24f.toString(16) + ";";
        } else {
            return _24e;
        }
    }
}

function EscapeCharacters(str) {
    var _251 = new StringBuilder();
    for (var c = 0; c < str.length; c++) {
        var _253 = str.charCodeAt(c);
        if (_253 > 127) {
            _251.Append("&#x" + _253.toString(16) + ";");
        } else {
            if (_253 < 32) {
                _251.Append("&amp;#x" + _253.toString(16) + ";");
            } else {
                _251.Append(str.charAt(c));
            }
        }
    }
    return _251.toString();
}

function ActivityObjective(_254, _255, _256, _257, _258, _259, _25a, _25b, _25c, _25d, _25e, _25f, _260, _261, _262, _263, _264, _265, _266) {
    this.Identifier = _254;
    this.ProgressStatus = _255;
    this.SatisfiedStatus = _256;
    this.MeasureStatus = _257;
    this.NormalizedMeasure = _258;
    this.Primary = _259;
    this.PrevProgressStatus = _25a;
    this.PrevSatisfiedStatus = _25b;
    this.PrevMeasureStatus = _25c;
    this.PrevNormalizedMeasure = _25d;
    this.FirstSuccessTimestampUtc = _25e;
    this.FirstNormalizedMeasure = _25f;
    this.ScoreRaw = _260;
    this.ScoreMin = _261;
    this.ScoreMax = _262;
    this.CompletionStatus = _263;
    this.CompletionStatusValue = _264;
    this.ProgressMeasureStatus = _265;
    this.ProgressMeasure = _266;
    this.SatisfiedByMeasure = false;
    this.MinNormalizedMeasure = 1;
    this.Maps = new Array();
    this.DataState = DATA_STATE_CLEAN;
    this.Sequencer = null;
}
ActivityObjective.prototype.GetXml = ActivityObjective_GetXml;
ActivityObjective.prototype.toString = ActivityObjective_toString;
ActivityObjective.prototype.ResetAttemptState = ActivityObjective_ResetAttemptState;
ActivityObjective.prototype.GetContributesToRollup = ActivityObjective_GetContributesToRollup;
ActivityObjective.prototype.GetMeasureStatus = ActivityObjective_GetMeasureStatus;
ActivityObjective.prototype.GetNormalizedMeasure = ActivityObjective_GetNormalizedMeasure;
ActivityObjective.prototype.SetMeasureStatus = ActivityObjective_SetMeasureStatus;
ActivityObjective.prototype.SetNormalizedMeasure = ActivityObjective_SetNormalizedMeasure;
ActivityObjective.prototype.SetProgressStatus = ActivityObjective_SetProgressStatus;
ActivityObjective.prototype.SetSatisfiedStatus = ActivityObjective_SetSatisfiedStatus;
ActivityObjective.prototype.GetSatisfiedByMeasure = ActivityObjective_GetSatisfiedByMeasure;
ActivityObjective.prototype.GetMinimumSatisfiedNormalizedMeasure = ActivityObjective_GetMinimumSatisfiedNormalizedMeasure;
ActivityObjective.prototype.GetProgressStatus = ActivityObjective_GetProgressStatus;
ActivityObjective.prototype.GetSatisfiedStatus = ActivityObjective_GetSatisfiedStatus;
ActivityObjective.prototype.GetScoreRaw = ActivityObjective_GetScoreRaw;
ActivityObjective.prototype.GetScoreMin = ActivityObjective_GetScoreMin;
ActivityObjective.prototype.GetScoreMax = ActivityObjective_GetScoreMax;
ActivityObjective.prototype.GetCompletionStatus = ActivityObjective_GetCompletionStatus;
ActivityObjective.prototype.GetCompletionStatusValue = ActivityObjective_GetCompletionStatusValue;
ActivityObjective.prototype.GetProgressMeasureStatus = ActivityObjective_GetProgressMeasureStatus;
ActivityObjective.prototype.GetProgressMeasure = ActivityObjective_GetProgressMeasure;
ActivityObjective.prototype.SetScoreRaw = ActivityObjective_SetScoreRaw;
ActivityObjective.prototype.SetScoreMin = ActivityObjective_SetScoreMin;
ActivityObjective.prototype.SetScoreMax = ActivityObjective_SetScoreMax;
ActivityObjective.prototype.SetCompletionStatus = ActivityObjective_SetCompletionStatus;
ActivityObjective.prototype.SetCompletionStatusValue = ActivityObjective_SetCompletionStatusValue;
ActivityObjective.prototype.SetProgressMeasureStatus = ActivityObjective_SetProgressMeasureStatus;
ActivityObjective.prototype.SetProgressMeasure = ActivityObjective_SetProgressMeasure;
ActivityObjective.prototype.GetIdentifier = ActivityObjective_GetIdentifier;
ActivityObjective.prototype.GetMaps = ActivityObjective_GetMaps;
ActivityObjective.prototype.SetDirtyData = ActivityObjective_SetDirtyData;
ActivityObjective.prototype.SetSequencer = ActivityObjective_SetSequencer;
ActivityObjective.prototype.Clone = ActivityObjective_Clone;
ActivityObjective.prototype.TearDown = ActivityObjective_TearDown;
ActivityObjective.prototype.GetSuccessStatusChangedDuringRuntime = ActivityObjective_GetSuccessStatusChangedDuringRuntime;

function ActivityObjective_GetXml(_267, _268) {
    var _269 = new ServerFormater();
    var xml = new XmlElement("AO");
    xml.AddAttribute("AI", _267);
    xml.AddAttribute("AOI", _268);
    xml.AddAttribute("I", this.Identifier);
    xml.AddAttribute("PS", _269.ConvertBoolean(this.ProgressStatus));
    xml.AddAttribute("SS", _269.ConvertBoolean(this.SatisfiedStatus));
    xml.AddAttribute("MS", _269.ConvertBoolean(this.MeasureStatus));
    xml.AddAttribute("NM", this.NormalizedMeasure);
    xml.AddAttribute("PPS", _269.ConvertBoolean(this.PrevProgressStatus));
    xml.AddAttribute("PSS", _269.ConvertBoolean(this.PrevSatisfiedStatus));
    xml.AddAttribute("PMS", _269.ConvertBoolean(this.PrevMeasureStatus));
    xml.AddAttribute("PNM", this.PrevNormalizedMeasure);
    if (this.FirstSuccessTimestampUtc !== null) {
        xml.AddAttribute("FSTU", this.FirstSuccessTimestampUtc);
    }
    if (this.FirstNormalizedMeasure !== null) {
        xml.AddAttribute("FNM", this.FirstNormalizedMeasure);
    }
    xml.AddAttribute("P", _269.ConvertBoolean(this.Primary));
    xml.AddAttribute("CS", _269.ConvertBoolean(this.CompletionStatus));
    xml.AddAttribute("CSV", _269.ConvertBoolean(this.CompletionStatusValue));
    if (this.ScoreRaw !== null) {
        xml.AddAttribute("SR", this.ScoreRaw);
    }
    if (this.ScoreMax !== null) {
        xml.AddAttribute("SM", this.ScoreMax);
    }
    if (this.ScoreMin !== null) {
        xml.AddAttribute("SMi", this.ScoreMin);
    }
    xml.AddAttribute("PrMS", _269.ConvertBoolean(this.ProgressMeasureStatus));
    if (this.ProgressMeasure !== null) {
        xml.AddAttribute("PM", this.ProgressMeasure);
    }
    return xml.toString();
}

function ActivityObjective_toString() {
    return this.Identifier;
}

function ActivityObjective_ResetAttemptState() {
    this.PrevProgressStatus = this.ProgressStatus;
    this.PrevSatisfiedStatus = this.SatisfiedStatus;
    this.PrevMeasureStatus = this.MeasureStatus;
    this.PrevNormalizedMeasure = this.NormalizedMeasure;
    this.ProgressStatus = false;
    this.SatisfiedStatus = false;
    this.MeasureStatus = false;
    this.NormalizedMeasure = 0;
    this.ScoreRaw = null;
    this.ScoreMin = null;
    this.ScoreMax = null;
    this.CompletionStatus = false;
    this.CompletionStatusValue = false;
    this.ProgressMeasureStatus = false;
    this.ProgressMeasure = null;
    this.SetDirtyData();
}

function ActivityObjective_GetContributesToRollup() {
    var _26b = this.Primary;
    return _26b;
}

function ActivityObjective_GetMeasureStatus(_26c, _26d) {
    if (_26d === null || _26d === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into GetMeasureStatus");
    }
    var _26e;
    if (_26d === true && (_26c != null && _26c != undefined) && _26c.WasAttemptedDuringThisAttempt() === false) {
        _26e = this.PrevMeasureStatus;
    } else {
        _26e = this.MeasureStatus;
    }
    var _26f = (_26e === false) || Control.Package.LearningStandard.is20043rdOrGreater();
    if (_26f === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadNormalizedMeasure === true) {
                var _272 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_272 !== null) {
                    _26e = _272.MeasureStatus;
                }
            }
        }
    }
    return _26e;
}

function ActivityObjective_GetNormalizedMeasure(_273, _274) {
    if (_274 === null || _274 === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into GetNormalizedMeasure");
    }
    var _275;
    var _276;
    if (_274 === true && (_273 != null && _273 != undefined) && _273.WasAttemptedDuringThisAttempt() === false) {
        _275 = this.PrevMeasureStatus;
        _276 = this.PrevNormalizedMeasure;
    } else {
        _275 = this.MeasureStatus;
        _276 = this.NormalizedMeasure;
    }
    var _277 = (_275 === false) || Control.Package.LearningStandard.is20043rdOrGreater();
    if (_277 === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadNormalizedMeasure === true) {
                var _27a = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_27a !== null && _27a.MeasureStatus === true) {
                    _276 = _27a.NormalizedMeasure;
                }
            }
        }
    }
    return _276;
}

function ActivityObjective_SetMeasureStatus(_27b, _27c) {
    if (_27c === null || _27c === undefined) {
        Debug.AssertError("ERROR - activity must be passed into SetMeasureStatus");
    }
    this.MeasureStatus = _27b;
    if (_27b === true) {
        _27c.SetAttemptedDuringThisAttempt();
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].WriteNormalizedMeasure === true) {
                var _27f = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_27f === null) {
                    this.Sequencer.AddGlobalObjective(maps[i].TargetObjectiveId, false, false, true, 0);
                } else {
                    _27f.MeasureStatus = true;
                    _27f.SetDirtyData();
                }
            }
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_SetNormalizedMeasure(_280, _281) {
    this.NormalizedMeasure = _280;
    if (this.MeasureStatus === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].WriteNormalizedMeasure === true) {
                var _284 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_284 === null) {
                    this.Sequencer.AddGlobalObjective(maps[i].TargetObjectiveId, false, false, true, _280);
                } else {
                    _284.NormalizedMeasure = _280;
                    _284.SetDirtyData();
                }
            }
        }
    }
    if (_281 === null || _281 === undefined) {
        Debug.AssertError("ERROR - activity must be passed into SetNormalizedMeasure");
    }
    if (this.GetSatisfiedByMeasure() === true && (_281.IsActive() === false || _281.GetMeasureSatisfactionIfActive() === true)) {
        var _285 = true;
        var _286;
        if (this.GetNormalizedMeasure(_281, false) >= this.GetMinimumSatisfiedNormalizedMeasure()) {
            _286 = true;
        } else {
            _286 = false;
        }
        this.SetProgressStatus(_285, true, _281);
        this.SetSatisfiedStatus(_286, true, _281);
    }
    if (this.ProgressStatus === true && this.FirstNormalizedMeasure == 0) {
        this.FirstNormalizedMeasure = _280;
    }
    this.SetDirtyData();
}

function ActivityObjective_SetProgressStatus(_287, _288, _289, _28a, _28b) {
    if (_289 === null || _289 === undefined) {
        Debug.AssertError("ERROR - activity must be passed into SetMeasureStatus");
    }
    if (this.GetSatisfiedByMeasure() === false || _288 === true) {
        this.ProgressStatus = _287;
        if (_287 === true) {
            _289.SetAttemptedDuringThisAttempt();
        }
        var _28c = _287;
        if (Control.Package.LearningStandard.is20044thOrGreater()) {
            _28c = _28c || (_28a === true);
        }
        if (_28c) {
            var maps = this.Maps;
            for (var i = 0; i < maps.length; i++) {
                if (maps[i].WriteSatisfiedStatus === true) {
                    var _28f = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                    if (_28f === null) {
                        this.Sequencer.AddGlobalObjective(maps[i].TargetObjectiveId, _287, false, false, 0);
                    } else {
                        _28f.ProgressStatus = _287;
                        _28f.SetDirtyData();
                    }
                }
            }
        }
        this.SetDirtyData();
    }
}

function ActivityObjective_SetSatisfiedStatus(_290, _291, _292) {
    if (this.GetSatisfiedByMeasure() === false || _291 === true) {
        this.SatisfiedStatus = _290;
        if (_290 === true && Control.Package.Properties.SatisfiedCausesCompletion === true) {
            _292.SetAttemptProgressStatus(true);
            _292.SetAttemptCompletionStatus(true);
        }
        if (this.ProgressStatus === true) {
            if (this.FirstSuccessTimestampUtc === null && _290 === true) {
                this.FirstSuccessTimestampUtc = ConvertDateToIso8601String(new Date());
            }
            var maps = this.Maps;
            for (var i = 0; i < maps.length; i++) {
                if (maps[i].WriteSatisfiedStatus === true) {
                    var _295 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                    if (_295 === null) {
                        this.Sequencer.AddGlobalObjective(maps[i].TargetObjectiveId, true, _290, false, 0);
                    } else {
                        _295.SatisfiedStatus = _290;
                        _295.SetDirtyData();
                    }
                }
            }
        }
        this.SetDirtyData();
    }
}

function ActivityObjective_GetSatisfiedByMeasure() {
    var _296 = this.SatisfiedByMeasure;
    return _296;
}

function ActivityObjective_GetMinimumSatisfiedNormalizedMeasure() {
    var _297 = this.MinNormalizedMeasure;
    _297 = parseFloat(_297);
    return _297;
}

function ActivityObjective_GetProgressStatus(_298, _299) {
    if (_299 === null || _299 === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into GetProgressStatus");
    }
    if (_298 === null || _298 === undefined) {
        Debug.AssertError("ERROR - activity must be passed into ActivityObjective_GetProgressStatus");
    }
    var _29a;
    if (_299 === true && _298.WasAttemptedDuringThisAttempt() === false) {
        _29a = this.PrevProgressStatus;
    } else {
        _29a = this.ProgressStatus;
    }
    var _29b = (_29a === false) || Control.Package.LearningStandard.is20043rdOrGreater();
    if (_29b === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadSatisfiedStatus === true) {
                var _29e = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_29e !== null) {
                    _29a = _29e.ProgressStatus;
                }
            }
        }
    }
    if (this.GetSatisfiedByMeasure() === true && (_298.IsActive() === false || _298.GetMeasureSatisfactionIfActive() === true)) {
        if (this.GetMeasureStatus(_298, _299) === true) {
            _29a = true;
        } else {
            _29a = false;
        }
    }
    return _29a;
}

function ActivityObjective_GetSatisfiedStatus(_29f, _2a0) {
    if (_2a0 === null || _2a0 === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into GetSatisfiedStatus");
    }
    var _2a1;
    var _2a2;
    if (_2a0 === true && _29f.WasAttemptedDuringThisAttempt() === false) {
        _2a2 = this.PrevProgressStatus;
        _2a1 = this.PrevSatisfiedStatus;
    } else {
        _2a2 = this.ProgressStatus;
        _2a1 = this.SatisfiedStatus;
    }
    var _2a3 = (_2a2 === false) || Control.Package.LearningStandard.is20043rdOrGreater();
    if (_2a3 === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadSatisfiedStatus === true) {
                var _2a6 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2a6 !== null && _2a6.ProgressStatus === true) {
                    _2a1 = _2a6.SatisfiedStatus;
                }
            }
        }
    }
    if (_29f === null || _29f === undefined) {
        Debug.AssertError("ERROR - activity must be passed into ActivityObjective_GetSatisfiedStatus");
    } else {
        if (this.GetSatisfiedByMeasure() === true && (_29f.IsActive() === false || _29f.GetMeasureSatisfactionIfActive() === true)) {
            if (this.GetMeasureStatus(_29f, _2a0) === true) {
                if (this.GetNormalizedMeasure(_29f, _2a0) >= this.GetMinimumSatisfiedNormalizedMeasure()) {
                    _2a1 = true;
                } else {
                    _2a1 = false;
                }
            }
        }
    }
    return _2a1;
}

function ActivityObjective_GetScoreRaw() {
    var _2a7 = this.ScoreRaw;
    var _2a8 = Control.Package.LearningStandard.is20044thOrGreater();
    if (_2a8 === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadRawScore === true) {
                var _2ab = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2ab !== null && _2ab.ScoreRaw !== null) {
                    _2a7 = _2ab.ScoreRaw;
                }
            }
        }
    }
    return _2a7;
}

function ActivityObjective_SetScoreRaw(_2ac) {
    this.ScoreRaw = _2ac;
    if (_2ac !== null) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].WriteRawScore === true) {
                var _2af = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2af !== null) {
                    _2af.ScoreRaw = _2ac;
                    _2af.SetDirtyData();
                }
            }
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_GetScoreMin() {
    var _2b0 = this.ScoreMin;
    var _2b1 = Control.Package.LearningStandard.is20044thOrGreater();
    if (_2b1 === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadMinScore === true) {
                var _2b4 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2b4 !== null && _2b4.ScoreMin !== null) {
                    _2b0 = _2b4.ScoreMin;
                }
            }
        }
    }
    return _2b0;
}

function ActivityObjective_SetScoreMin(_2b5) {
    this.ScoreMin = _2b5;
    if (_2b5 !== null) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].WriteMinScore === true) {
                var _2b8 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2b8 !== null) {
                    _2b8.ScoreMin = _2b5;
                    _2b8.SetDirtyData();
                }
            }
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_GetScoreMax() {
    var _2b9 = this.ScoreMax;
    var _2ba = Control.Package.LearningStandard.is20044thOrGreater();
    if (_2ba === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadMaxScore === true) {
                var _2bd = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2bd !== null && _2bd.ScoreMax !== null) {
                    _2b9 = _2bd.ScoreMax;
                }
            }
        }
    }
    return _2b9;
}

function ActivityObjective_SetScoreMax(_2be) {
    this.ScoreMax = _2be;
    if (_2be !== null) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].WriteMaxScore === true) {
                var _2c1 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2c1 !== null) {
                    _2c1.ScoreMax = _2be;
                    _2c1.SetDirtyData();
                }
            }
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_GetCompletionStatus(_2c2, _2c3) {
    if (_2c3 === null || _2c3 === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into GetCompletionStatus");
    }
    if (_2c2 === null || _2c2 === undefined) {
        Debug.AssertError("ERROR - activity must be passed into ActivityObjective_GetCompletionStatusValue");
    }
    var _2c4 = this.CompletionStatus;
    var _2c5 = Control.Package.LearningStandard.is20044thOrGreater();
    if (_2c5 === true) {
        var maps = this.Maps;
        var _2c7;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadCompletionStatus === true) {
                _2c7 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2c7 !== null) {
                    _2c4 = _2c7.CompletionStatus;
                }
            }
        }
    }
    return _2c4;
}

function ActivityObjective_GetCompletionStatusValue(_2c9, _2ca) {
    if (_2ca === null || _2ca === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into GetCompletionStatusValue");
    }
    if (_2c9 === null || _2c9 === undefined) {
        Debug.AssertError("ERROR - activity must be passed into ActivityObjective_GetCompletionStatusValue");
    }
    var _2cb = this.CompletionStatusValue;
    var _2cc = Control.Package.LearningStandard.is20044thOrGreater();
    if (_2cc === true) {
        var maps = this.GetMaps("ReadCompletionStatus", true);
        for (var i = 0; i < maps.length; i++) {
            var _2cf = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
            if (_2cf !== null) {
                _2cb = _2cf.CompletionStatusValue;
            }
        }
    }
    return _2cb;
}

function ActivityObjective_SetCompletionStatus(_2d0) {
    this.CompletionStatus = _2d0;
    var maps = this.GetMaps("WriteCompletionStatus", true);
    for (var i = 0; i < maps.length; i++) {
        var _2d3 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
        if (_2d3 !== null) {
            _2d3.CompletionStatus = _2d0;
            _2d3.SetDirtyData();
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_SetCompletionStatusValue(_2d4) {
    this.CompletionStatusValue = _2d4;
    var maps = this.GetMaps("WriteCompletionStatus", true);
    for (var i = 0; i < maps.length; i++) {
        var _2d7 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
        if (_2d7 !== null) {
            _2d7.CompletionStatusValue = _2d4;
            _2d7.SetDirtyData();
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_GetProgressMeasureStatus() {
    var _2d8 = this.ProgressMeasureStatus;
    var _2d9 = Control.Package.LearningStandard.is20044thOrGreater();
    if (_2d9 === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadProgressMeasure === true) {
                var _2dc = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2dc !== null) {
                    _2d8 = _2dc.ProgressMeasureStatus;
                }
            }
        }
    }
    return _2d8;
}

function ActivityObjective_GetProgressMeasure() {
    var _2dd = this.ProgressMeasure;
    var _2de = Control.Package.LearningStandard.is20044thOrGreater();
    if (_2de === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].ReadProgressMeasure === true) {
                var _2e1 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2e1 !== null && _2e1.ProgressMeasureStatus !== false) {
                    _2dd = _2e1.ProgressMeasure;
                }
            }
        }
    }
    return _2dd;
}

function ActivityObjective_SetProgressMeasureStatus(_2e2) {
    this.ProgressMeasureStatus = _2e2;
    var maps = this.Maps;
    for (var i = 0; i < maps.length; i++) {
        if (maps[i].WriteProgressMeasure === true) {
            var _2e5 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
            if (_2e5 !== null) {
                _2e5.ProgressMeasureStatus = _2e2;
                _2e5.SetDirtyData();
            }
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_SetProgressMeasure(_2e6) {
    this.ProgressMeasure = _2e6;
    if (this.ProgressMeasureStatus === true) {
        var maps = this.Maps;
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].WriteProgressMeasure === true) {
                var _2e9 = this.Sequencer.GetGlobalObjectiveByIdentifier(maps[i].TargetObjectiveId);
                if (_2e9 !== null) {
                    _2e9.ProgressMeasure = _2e6;
                    _2e9.SetDirtyData();
                }
            }
        }
    }
    this.SetDirtyData();
}

function ActivityObjective_GetIdentifier() {
    var _2ea = this.Identifier;
    return _2ea;
}

function ActivityObjective_GetMaps(_2eb, _2ec) {
    var maps = this.Maps;
    if (maps.length > 0 && _2eb !== null && _2eb !== undefined) {
        if (_2ec === null && _2ec === undefined) {
            _2ec = true;
        }
        var _2ee = new Array();
        for (var i = 0; i < maps.length; i++) {
            if (maps[i][_2eb] === _2ec) {
                _2ee[_2ee.length] = maps[i];
            }
        }
        return _2ee;
    }
    return maps;
}

function ActivityObjective_SetDirtyData() {
    this.DataState = DATA_STATE_DIRTY;
}

function ActivityObjective_SetSequencer(_2f0) {
    this.Sequencer = _2f0;
}

function ActivityObjective_Clone() {
    var _2f1 = new ActivityObjective(this.Identifier, this.ProgressStatus, this.SatisfiedStatus, this.MeasureStatus, this.NormalizedMeasure, this.Primary, null, null, null, null, null, null, this.ScoreRaw, this.ScoreMin, this.ScoreMax, this.CompletionStatus, this.CompletionStatusValue, this.ProgressMeasureStatus, this.ProgressMeasure);
    _2f1.SatisfiedByMeasure = this.SatisfiedByMeasure;
    _2f1.MinNormalizedMeasure = this.MinNormalizedMeasure;
    _2f1.CompletionStatusSetAtRuntime = this.CompletionStatusSetAtRuntime;
    _2f1.Maps = this.Maps;
    return _2f1;
}

function ActivityObjective_TearDown() {
    this.Identifier = null;
    this.ProgressStatus = null;
    this.SatisfiedStatus = null;
    this.MeasureStatus = null;
    this.NormalizedMeasure = null;
    this.ScoreRaw = null;
    this.ScoreMin = null;
    this.ScoreMax = null;
    this.CompletionStatus = null;
    this.CompletionStatusValue = null;
    this.ProgressMeasure = null;
    this.Primary = null;
    this.SatisfiedByMeasure = null;
    this.MinNormalizedMeasure = null;
    this.Maps = null;
    this.DataState = null;
    this.Sequencer = null;
    this.ProgressMeasureStatus = null;
    this.ProgressMeasure = null;
}

function ActivityObjective_GetSuccessStatusChangedDuringRuntime(_2f2) {
    var _2f3 = _2f2.RunTime.FindObjectiveWithId(this.Identifier);
    if (_2f3 !== null) {
        if (_2f3.SuccessStatusChangedDuringRuntime === true) {
            return true;
        }
    }
    return false;
}

function ActivityRunTimeComment(_2f4, _2f5, _2f6, _2f7, _2f8) {
    this.Comment = _2f4;
    this.Language = _2f5;
    this.Location = _2f6;
    this.TimestampUtc = _2f7;
    this.Timestamp = _2f8;
}
ActivityRunTimeComment.prototype.GetXml = ActivityRunTimeComment_GetXml;
ActivityRunTimeComment.prototype.toString = ActivityRunTimeComment_toString;
ActivityRunTimeComment.prototype.GetCommentValue = ActivityRunTimeComment_GetCommentValue;
ActivityRunTimeComment.prototype.SetCommentValue = ActivityRunTimeComment_SetCommentValue;

function ActivityRunTimeComment_GetXml(_2f9, _2fa, _2fb) {
    var _2fc = new ServerFormater();
    var xml = new XmlElement("ARTC");
    xml.AddAttribute("AI", _2f9);
    xml.AddAttribute("I", _2fa);
    xml.AddAttribute("FL", _2fc.ConvertBoolean(_2fb));
    if (this.Comment !== null) {
        xml.AddAttribute("C", _2fc.TrimToLength(this.Comment, 4000));
    }
    if (this.Language !== null) {
        xml.AddAttribute("L", this.Language);
    }
    if (this.Location !== null) {
        xml.AddAttribute("Lo", _2fc.TrimToLength(this.Location, 250));
    }
    if (this.Timestamp !== null && this.Timestamp != "") {
        xml.AddAttribute("TU", _2fc.ConvertTime(this.Timestamp));
        xml.AddAttribute("T", this.Timestamp);
    }
    return xml.toString();
}

function ActivityRunTimeComment_toString() {
    return "ActivityRunTimeComment";
}

function ActivityRunTimeComment_GetCommentValue() {
    var _2fe = "";
    if (this.Language !== null && this.Language !== undefined) {
        _2fe = this.Language;
    }
    _2fe += this.Comment;
    return _2fe;
}

function ActivityRunTimeComment_SetCommentValue(_2ff) {
    var _300 = "";
    var _301 = "";
    var _302 = _2ff.indexOf("}");
    if (_2ff.indexOf("{lang=") === 0 && _302 > 0) {
        _300 = _2ff.substr(0, _302 + 1);
        if (_2ff.length >= (_302 + 2)) {
            _301 = _2ff.substring(_302 + 1);
        }
    } else {
        _301 = _2ff;
    }
    this.Language = _300;
    this.Comment = _301;
}

function ActivityRunTimeInteraction(Id, Type, _305, _306, _307, _308, _309, _30a, _30b, _30c, _30d) {
    this.Id = Id;
    if (Type === "") {
        Type = "";
    }
    this.Type = Type;
    this.TimestampUtc = _305;
    this.Timestamp = _306;
    this.Weighting = _307;
    if (_308 === "") {
        _308 = null;
    }
    this.Result = _308;
    if (_309 === "") {
        _309 = null;
    }
    this.Latency = _309;
    this.Description = _30a;
    this.LearnerResponse = _30b;
    this.CorrectResponses = _30c;
    this.Objectives = _30d;
}
ActivityRunTimeInteraction.prototype.GetXml = ActivityRunTimeInteraction_GetXml;
ActivityRunTimeInteraction.prototype.toString = ActivityRunTimeInteraction_toString;

function ActivityRunTimeInteraction_GetXml(_30e, _30f) {
    var _310 = new ServerFormater();
    var xml = new XmlElement("ARTI");
    xml.AddAttribute("AI", _30e);
    xml.AddAttribute("I", _30f);
    xml.AddAttribute("Id", _310.TrimToLength(this.Id, 4000));
    if (this.Type !== null) {
        xml.AddAttribute("T", _310.ConvertInteractionType(this.Type));
    }
    if (this.Timestamp !== null) {
        xml.AddAttribute("TU", _310.ConvertTime(this.Timestamp));
        xml.AddAttribute("Ti", this.Timestamp);
    }
    if (this.Weighting !== null) {
        xml.AddAttribute("W", this.Weighting);
    }
    if (this.Result !== null && this.Result !== "") {
        if (IsValidCMIDecimal(this.Result)) {
            xml.AddAttribute("R", _310.GetNumericInteractionResultId());
            xml.AddAttribute("RN", this.Result);
        } else {
            xml.AddAttribute("R", _310.ConvertInteractionResult(this.Result));
        }
    }
    if (this.Latency !== null) {
        xml.AddAttribute("L", _310.ConvertTimeSpan(this.Latency));
    }
    if (this.Description !== null) {
        xml.AddAttribute("D", _310.TrimToLength(this.Description, 500));
    }
    if (this.LearnerResponse !== null) {
        xml.AddAttribute("LR", _310.TrimToLength(this.LearnerResponse, 7800));
    }
    var _312;
    var i;
    for (i = 0; i < this.CorrectResponses.length; i++) {
        _312 = new XmlElement("CR");
        _312.AddAttribute("AI", _30e);
        _312.AddAttribute("II", _30f);
        _312.AddAttribute("I", i);
        _312.AddAttribute("V", _310.TrimToLength(this.CorrectResponses[i], 7800));
        xml.AddElement(_312.toString());
    }
    var _314;
    for (i = 0; i < this.Objectives.length; i++) {
        _314 = new XmlElement("O");
        _314.AddAttribute("AI", _30e);
        _314.AddAttribute("II", _30f);
        _314.AddAttribute("I", i);
        _314.AddAttribute("Id", _310.TrimToLength(this.Objectives[i], 4000));
        xml.AddElement(_314.toString());
    }
    return xml.toString();
}

function ActivityRunTimeInteraction_toString() {
    return "ActivityRunTimeInteraction";
}

function ActivityRunTimeObjective(_315, _316, _317, _318, _319, _31a, _31b, _31c, _31d) {
    this.Identifier = _315;
    this.SuccessStatus = _316;
    this.CompletionStatus = _317;
    this.ScoreScaled = _318;
    this.ScoreRaw = _319;
    this.ScoreMax = _31a;
    this.ScoreMin = _31b;
    this.ProgressMeasure = _31c;
    this.Description = _31d;
    this.SuccessStatusChangedDuringRuntime = false;
    this.MeasureChangedDuringRuntime = false;
    this.ProgressMeasureChangedDuringRuntime = false;
    this.CompletionStatusChangedDuringRuntime = false;
}
ActivityRunTimeObjective.prototype.GetXml = ActivityRunTimeObjective_GetXml;
ActivityRunTimeObjective.prototype.toString = ActivityRunTimeObjective_toString;

function ActivityRunTimeObjective_GetXml(_31e, _31f) {
    var _320 = new ServerFormater();
    var xml = new XmlElement("ARTO");
    xml.AddAttribute("AI", _31e);
    xml.AddAttribute("I", _31f);
    if (this.Identifier !== null) {
        xml.AddAttribute("Id", _320.TrimToLength(this.Identifier, 4000));
    }
    xml.AddAttribute("SS", _320.ConvertSuccessStatus(this.SuccessStatus));
    xml.AddAttribute("CS", _320.ConvertCompletionStatus(this.CompletionStatus));
    if (this.ScoreScaled !== null) {
        xml.AddAttribute("SSc", this.ScoreScaled);
    }
    if (this.ScoreRaw !== null) {
        xml.AddAttribute("SR", this.ScoreRaw);
    }
    if (this.ScoreMax !== null) {
        xml.AddAttribute("SM", this.ScoreMax);
    }
    if (this.ScoreMin !== null) {
        xml.AddAttribute("SMi", this.ScoreMin);
    }
    if (this.ProgressMeasure !== null) {
        xml.AddAttribute("PM", this.ProgressMeasure);
    }
    if (this.Description !== null) {
        xml.AddAttribute("D", _320.TrimToLength(this.Description, 500));
    }
    return xml.toString();
}

function ActivityRunTimeObjective_toString() {
    return "ActivityRunTimeObjective - " + this.Identifier;
}

function ActivityRunTimeSSPBucket(Id, _323, _324, _325, _326, _327, _328, Data) {
    this.Id = Id;
    this.BucketType = _323;
    this.Persistence = _324;
    this.SizeMin = _325;
    this.SizeRequested = _326;
    this.Reducible = _327;
    this.TotalSpace = _328;
    this.Data = Data;
}
ActivityRunTimeSSPBucket.prototype.toString = function() {
    return "Id=" + this.Id + ", BucketType=" + this.BucketType + ", Persistence=" + this.Persistence + ", SizeMin=" + this.SizeMin + ", SizeRequested=" + this.SizeRequested + ", Reducible=" + this.Reducible + ", TotalSpace=" + this.TotalSpace + ", Data=" + this.Data;
};
var SCORM_MODE_NORMAL = "normal";
var SCORM_MODE_REVIEW = "review";
var SCORM_MODE_BROWSE = "browse";
var SCORM_STATUS_PASSED = "passed";
var SCORM_STATUS_COMPLETED = "completed";
var SCORM_STATUS_FAILED = "failed";
var SCORM_STATUS_INCOMPLETE = "incomplete";
var SCORM_STATUS_BROWSED = "browsed";
var SCORM_STATUS_NOT_ATTEMPTED = "not attempted";
var SCORM_STATUS_UNKNOWN = "unknown";
var SCORM_EXIT_TIME_OUT = "time-out";
var SCORM_EXIT_SUSPEND = "suspend";
var SCORM_EXIT_LOGOUT = "logout";
var SCORM_EXIT_NORMAL = "normal";
var SCORM_EXIT_UNKNOWN = "";
var SCORM_CREDIT = "credit";
var SCORM_CREDIT_NO = "no-credit";
var SCORM_ENTRY_AB_INITO = "ab-initio";
var SCORM_ENTRY_RESUME = "resume";
var SCORM_ENTRY_NORMAL = "";
var SCORM_TRUE_FALSE = "true-false";
var SCORM_CHOICE = "choice";
var SCORM_FILL_IN = "fill-in";
var SCORM_MATCHING = "matching";
var SCORM_PERFORMANCE = "performance";
var SCORM_SEQUENCING = "sequencing";
var SCORM_LIKERT = "likert";
var SCORM_NUMERIC = "numeric";
var SCORM_LONG_FILL_IN = "long-fill-in";
var SCORM_OTHER = "other";
var SCORM_CORRECT = "correct";
var SCORM_WRONG = "wrong";
var SCORM_INCORRECT = "incorrect";
var SCORM_UNANTICIPATED = "unanticipated";
var SCORM_NEUTRAL = "neutral";
var SCORM_RUNTIME_NAV_REQUEST_CONTINUE = "continue";
var SCORM_RUNTIME_NAV_REQUEST_PREVIOUS = "previous";
var SCORM_RUNTIME_NAV_REQUEST_CHOICE = "choice";
var SCORM_RUNTIME_NAV_REQUEST_JUMP = "jump";
var SCORM_RUNTIME_NAV_REQUEST_EXIT = "exit";
var SCORM_RUNTIME_NAV_REQUEST_EXITALL = "exitAll";
var SCORM_RUNTIME_NAV_REQUEST_ABANDON = "abandon";
var SCORM_RUNTIME_NAV_REQUEST_ABANDONALL = "abandonAll";
var SCORM_RUNTIME_NAV_REQUEST_SUSPENDALL = "suspendAll";
var SCORM_RUNTIME_NAV_REQUEST_NONE = "_none_";

function ActivityRunTime(_32a, _32b, _32c, Exit, _32e, Mode, _330, _331, _332, _333, _334, _335, _336, _337, _338, _339, _33a, _33b, _33c, _33d, _33e, _33f, _340) {
    this.CompletionStatus = _32a;
    this.Credit = _32b;
    this.Entry = _32c;
    this.Exit = Exit;
    this.Location = _32e;
    this.Mode = Mode;
    this.ProgressMeasure = _330;
    this.ScoreRaw = _331;
    this.ScoreMax = _332;
    this.ScoreMin = _333;
    this.ScoreScaled = _334;
    this.SuccessStatus = _335;
    this.SuspendData = _336;
    this.TotalTime = _337;
    this.TotalTimeTracked = _338;
    this.AudioLevel = _339;
    this.LanguagePreference = _33a;
    this.DeliverySpeed = _33b;
    this.AudioCaptioning = _33c;
    this.Comments = _33d;
    this.CommentsFromLMS = _33e;
    this.Interactions = _33f;
    this.Objectives = _340;
    this.LookAheadCompletionStatus = _32a;
    this.LookAheadSuccessStatus = _335;
    this.CompletionStatusChangedDuringRuntime = false;
    this.SuccessStatusChangedDuringRuntime = false;
    this.SessionTime = "";
    this.SessionTimeTracked = "";
    this.NavRequest = SCORM_RUNTIME_NAV_REQUEST_NONE;
    this.DataState = DATA_STATE_CLEAN;
}
ActivityRunTime.prototype.ResetState = ActivityRunTime_ResetState;
ActivityRunTime.prototype.GetXml = ActivityRunTime_GetXml;
ActivityRunTime.prototype.toString = ActivityRunTime_toString;
ActivityRunTime.prototype.SetDirtyData = ActivityRunTime_SetDirtyData;
ActivityRunTime.prototype.IsValidObjectiveIndex = ActivityRunTime_IsValidObjectiveIndex;
ActivityRunTime.prototype.IsValidInteractionIndex = ActivityRunTime_IsValidInteractionIndex;
ActivityRunTime.prototype.IsValidInteractionObjectiveIndex = ActivityRunTime_IsValidInteractionObjectiveIndex;
ActivityRunTime.prototype.IsValidInteractionCorrectResponseIndex = ActivityRunTime_IsValidInteractionCorrectResponseIndex;
ActivityRunTime.prototype.AddObjective = ActivityRunTime_AddObjective;
ActivityRunTime.prototype.AddInteraction = ActivityRunTime_AddInteraction;
ActivityRunTime.prototype.AddComment = ActivityRunTime_AddComment;
ActivityRunTime.prototype.FindObjectiveWithId = ActivityRunTime_FindObjectiveWithId;

function ActivityRunTime_ResetState() {
    this.CompletionStatus = SCORM_STATUS_UNKNOWN;
    this.Entry = SCORM_ENTRY_AB_INITO;
    this.Exit = SCORM_EXIT_UNKNOWN;
    this.Location = null;
    if (RegistrationToDeliver.LessonMode !== SCORM_MODE_REVIEW && RegistrationToDeliver.LessonMode !== SCORM_MODE_BROWSE) {
        this.Mode = SCORM_MODE_NORMAL;
    }
    this.ProgressMeasure = null;
    this.ScoreRaw = null;
    this.ScoreMax = null;
    this.ScoreMin = null;
    this.ScoreScaled = null;
    this.SuccessStatus = SCORM_STATUS_UNKNOWN;
    this.SuspendData = null;
    this.TotalTime = "PT0H0M0S";
    this.TotalTimeTracked = "PT0H0M0S";
    if (Control.Package.Properties.MakeStudentPrefsGlobalToCourse !== true) {
        this.AudioLevel = 1;
        this.LanguagePreference = "";
        this.DeliverySpeed = 1;
        this.AudioCaptioning = 0;
    }
    this.Comments = new Array();
    this.CommentsFromLMS = new Array();
    this.Interactions = new Array();
    this.Objectives = new Array();
    this.LookAheadCompletionStatus = this.CompletionStatus;
    this.LookAheadSuccessStatus = this.SuccessStatus;
    this.SessionTime = "";
    this.NavRequest = SCORM_RUNTIME_NAV_REQUEST_NONE;
    this.CompletionStatusChangedDuringRuntime = false;
    this.SuccessStatusChangedDuringRuntime = false;
    this.SetDirtyData();
}

function ActivityRunTime_GetXml(_341) {
    var _342 = new ServerFormater();
    var xml = new XmlElement("ART");
    xml.AddAttribute("AI", _341);
    xml.AddAttribute("CS", _342.ConvertCompletionStatus(this.CompletionStatus));
    xml.AddAttribute("C", _342.ConvertCredit(this.Credit));
    xml.AddAttribute("E", _342.ConvertEntry(this.Entry));
    xml.AddAttribute("Ex", _342.ConvertExit(this.Exit));
    if (this.Location !== null) {
        xml.AddAttribute("L", _342.TrimToLength(this.Location, 1000));
    }
    xml.AddAttribute("M", _342.ConvertMode(this.Mode));
    if (this.ProgressMeasure !== null) {
        xml.AddAttribute("PM", this.ProgressMeasure);
    }
    if (this.ScoreRaw !== null) {
        xml.AddAttribute("SR", this.ScoreRaw);
    }
    if (this.ScoreMax !== null) {
        xml.AddAttribute("SM", this.ScoreMax);
    }
    if (this.ScoreMin !== null) {
        xml.AddAttribute("SMi", this.ScoreMin);
    }
    if (this.ScoreScaled !== null) {
        xml.AddAttribute("SS", this.ScoreScaled);
    }
    xml.AddAttribute("SuS", _342.ConvertSuccessStatus(this.SuccessStatus));
    if (this.SuspendData !== null) {
        xml.AddAttribute("SD", _342.TrimToLength(this.SuspendData, Control.Package.Properties.SuspendDataMaxLength));
    }
    xml.AddAttribute("TT", _342.ConvertTimeSpan(this.TotalTime));
    xml.AddAttribute("TTT", _342.ConvertTimeSpan(this.TotalTimeTracked));
    xml.AddAttribute("AL", this.AudioLevel);
    xml.AddAttribute("LP", _342.TrimToLength(this.LanguagePreference, 250));
    xml.AddAttribute("DS", this.DeliverySpeed);
    xml.AddAttribute("AC", this.AudioCaptioning);
    var i;
    for (i = 0; i < this.Comments.length; i++) {
        xml.AddElement(this.Comments[i].GetXml(_341, i, false));
    }
    for (i = 0; i < this.CommentsFromLMS.length; i++) {
        xml.AddElement(this.CommentsFromLMS[i].GetXml(_341, i, true));
    }
    for (i = 0; i < this.Interactions.length; i++) {
        xml.AddElement(this.Interactions[i].GetXml(_341, i));
    }
    for (i = 0; i < this.Objectives.length; i++) {
        xml.AddElement(this.Objectives[i].GetXml(_341, i));
    }
    return xml.toString();
}

function ActivityRunTime_toString() {
    return "RunTimeData - CompletionStatus=" + this.CompletionStatus + ", SuccessStatus=" + this.SuccessStatus;
}

function ActivityRunTime_SetDirtyData() {
    this.DataState = DATA_STATE_DIRTY;
}

function ActivityRunTime_IsValidObjectiveIndex(_345) {
    _345 = parseInt(_345, 10);
    if (_345 <= this.Objectives.length) {
        return true;
    } else {
        return false;
    }
}

function ActivityRunTime_IsValidInteractionIndex(_346) {
    _346 = parseInt(_346, 10);
    if (_346 <= this.Interactions.length) {
        return true;
    } else {
        return false;
    }
}

function ActivityRunTime_IsValidInteractionObjectiveIndex(_347, _348) {
    _347 = parseInt(_347, 10);
    _348 = parseInt(_348, 10);
    if (this.Interactions[_347]) {
        if (_348 <= this.Interactions[_347].Objectives.length) {
            return true;
        } else {
            return false;
        }
    } else {
        if (_348 === 0) {
            return true;
        } else {
            return false;
        }
    }
}

function ActivityRunTime_IsValidInteractionCorrectResponseIndex(_349, _34a) {
    _349 = parseInt(_349, 10);
    _34a = parseInt(_34a, 10);
    if (this.Interactions[_349]) {
        if (_34a <= this.Interactions[_349].CorrectResponses.length) {
            return true;
        } else {
            return false;
        }
    } else {
        if (_34a === 0) {
            return true;
        } else {
            return false;
        }
    }
}

function ActivityRunTime_AddObjective() {
    this.Objectives[this.Objectives.length] = new ActivityRunTimeObjective(null, SCORM_STATUS_UNKNOWN, SCORM_STATUS_UNKNOWN, null, null, null, null, null, null);
}

function ActivityRunTime_AddInteraction() {
    this.Interactions[this.Interactions.length] = new ActivityRunTimeInteraction(null, null, null, null, null, null, null, null, null, new Array(), new Array());
}

function ActivityRunTime_AddComment() {
    this.Comments[this.Comments.length] = new ActivityRunTimeComment(null, null, null, null, null);
}

function ActivityRunTime_FindObjectiveWithId(id) {
    for (var i = 0; i < this.Objectives.length; i++) {
        if (this.Objectives[i].Identifier == id) {
            return this.Objectives[i];
        }
    }
    return null;
}

function Activity(_34d, _34e, _34f, _350, _351, _352, _353, _354, _355, _356, _357, _358, _359, _35a, _35b, _35c, _35d, _35e, _35f, _360, _361, _362, _363, _364, _365, _366, _367, _368, _369, _36a) {
    this.StringIdentifier = null;
    this.DatabaseId = _34d;
    this.ItemIdentifier = _34e;
    this.ScormObjectDatabaseId = _34f;
    this.ActivityProgressStatus = _350;
    this.ActivityAttemptCount = _351;
    this.AttemptProgressStatus = _352;
    this.AttemptCompletionAmountStatus = _353;
    this.AttemptCompletionAmount = _354;
    this.AttemptCompletionStatus = _355;
    this.Active = _356;
    this.Suspended = _357;
    this.Included = _358;
    this.Ordinal = _359;
    this.SelectedChildren = _35a;
    this.RandomizedChildren = _35b;
    this.ActivityObjectives = _35c;
    this.RunTime = _35d;
    this.PrevAttemptProgressStatus = _35e;
    this.PrevAttemptCompletionStatus = _35f;
    this.AttemptedDuringThisAttempt = _360;
    this.FirstCompletionTimestampUtc = _361;
    this.ActivityStartTimestampUtc = _362;
    this.AttemptStartTimestampUtc = _363;
    this.ActivityAbsoluteDuration = _364;
    this.AttemptAbsoluteDuration = _365;
    this.ActivityExperiencedDurationTracked = _366;
    this.AttemptExperiencedDurationTracked = _367;
    this.ActivityExperiencedDurationReported = _368;
    this.AttemptExperiencedDurationReported = _369;
    this.AiccSessionId = _36a;
    this.IsDurations = ConvertIso8601TimeSpanToHundredths(_364) >= 0;
    this.ActivityEndedDate = null;
    this.Sequencer = null;
    this.LookAheadActivity = false;
    this.LearningObject = null;
    this.ParentActivity = null;
    this.ChildActivities = new Array();
    this.AvailableChildren = null;
    this.DataState = DATA_STATE_CLEAN;
    this.MenuItem = null;
    this.CachedPrimaryObjective = null;
    this.HiddenFromChoice = false;
    this.HasSeqRulesRelevantToChoice = null;
    this.HasChildActivitiesDeliverableViaFlow = false;
    this.LaunchedThisSession = false;
}
Activity.prototype.GetXml = Activity_GetXml;
Activity.prototype.toString = Activity_toString;
Activity.prototype.GetTitle = Activity_GetTitle;
Activity.prototype.GetItemIdentifier = Activity_GetItemIdentifier;
Activity.prototype.GetDatabaseIdentifier = Activity_GetDatabaseIdentifier;
Activity.prototype.GetLaunchPath = Activity_GetLaunchPath;
Activity.prototype.IsDeliverable = Activity_IsDeliverable;
Activity.prototype.TransferRteDataToActivity = Activity_TransferRteDataToActivity;
Activity.prototype.IsTheRoot = Activity_IsTheRoot;
Activity.prototype.IsALeaf = Activity_IsALeaf;
Activity.prototype.IsActive = Activity_IsActive;
Activity.prototype.IsSuspended = Activity_IsSuspended;
Activity.prototype.HasSuspendedChildren = Activity_HasSuspendedChildren;
Activity.prototype.SetActive = Activity_SetActive;
Activity.prototype.SetSuspended = Activity_SetSuspended;
Activity.prototype.IsTracked = Activity_IsTracked;
Activity.prototype.IsCompletionSetByContent = Activity_IsCompletionSetByContent;
Activity.prototype.IsObjectiveSetByContent = Activity_IsObjectiveSetByContent;
Activity.prototype.GetAttemptProgressStatus = Activity_GetAttemptProgressStatus;
Activity.prototype.SetAttemptProgressStatus = Activity_SetAttemptProgressStatus;
Activity.prototype.SetAttemptCompletionStatus = Activity_SetAttemptCompletionStatus;
Activity.prototype.GetAttemptCompletionStatus = Activity_GetAttemptCompletionStatus;
Activity.prototype.GetChildren = Activity_GetChildren;
Activity.prototype.GetSequencingControlFlow = Activity_GetSequencingControlFlow;
Activity.prototype.GetSequencingControlChoice = Activity_GetSequencingControlChoice;
Activity.prototype.GetSequencingControlChoiceExit = Activity_GetSequencingControlChoiceExit;
Activity.prototype.GetSequencingControlForwardOnly = Activity_GetSequencingControlForwardOnly;
Activity.prototype.GetPreventActivation = Activity_GetPreventActivation;
Activity.prototype.GetConstrainedChoice = Activity_GetConstrainedChoice;
Activity.prototype.GetSelectionTiming = Activity_GetSelectionTiming;
Activity.prototype.GetSelectionCountStatus = Activity_GetSelectionCountStatus;
Activity.prototype.GetSelectionCount = Activity_GetSelectionCount;
Activity.prototype.GetRandomizationTiming = Activity_GetRandomizationTiming;
Activity.prototype.GetRandomizeChildren = Activity_GetRandomizeChildren;
Activity.prototype.GetLimitConditionAttemptControl = Activity_GetLimitConditionAttemptControl;
Activity.prototype.GetActivityProgressStatus = Activity_GetActivityProgressStatus;
Activity.prototype.SetActivityProgressStatus = Activity_SetActivityProgressStatus;
Activity.prototype.GetAttemptCount = Activity_GetAttemptCount;
Activity.prototype.GetLimitConditionAttemptLimit = Activity_GetLimitConditionAttemptLimit;
Activity.prototype.GetPreConditionRules = Activity_GetPreConditionRules;
Activity.prototype.GetPostConditionRules = Activity_GetPostConditionRules;
Activity.prototype.GetExitRules = Activity_GetExitRules;
Activity.prototype.IsSatisfied = Activity_IsSatisfied;
Activity.prototype.IsObjectiveStatusKnown = Activity_IsObjectiveStatusKnown;
Activity.prototype.IsObjectiveMeasureKnown = Activity_IsObjectiveMeasureKnown;
Activity.prototype.IsObjectiveMeasureGreaterThan = Activity_IsObjectiveMeasureGreaterThan;
Activity.prototype.IsObjectiveMeasureLessThan = Activity_IsObjectiveMeasureLessThan;
Activity.prototype.GetObjectiveMeasure = Activity_GetObjectiveMeasure;
Activity.prototype.IsCompleted = Activity_IsCompleted;
Activity.prototype.IsActivityProgressKnown = Activity_IsActivityProgressKnown;
Activity.prototype.IsAttempted = Activity_IsAttempted;
Activity.prototype.IsAttemptLimitExceeded = Activity_IsAttemptLimitExceeded;
Activity.prototype.GetObjectives = Activity_GetObjectives;
Activity.prototype.FindObjective = Activity_FindObjective;
Activity.prototype.GetPrimaryObjective = Activity_GetPrimaryObjective;
Activity.prototype.GetRollupObjectiveMeasureWeight = Activity_GetRollupObjectiveMeasureWeight;
Activity.prototype.GetMeasureSatisfactionIfActive = Activity_GetMeasureSatisfactionIfActive;
Activity.prototype.GetRollupRules = Activity_GetRollupRules;
Activity.prototype.ApplyRollupRule = Activity_ApplyRollupRule;
Activity.prototype.GetRollupObjectiveSatisfied = Activity_GetRollupObjectiveSatisfied;
Activity.prototype.GetRequiredForSatisfied = Activity_GetRequiredForSatisfied;
Activity.prototype.GetRequiredForNotSatisfied = Activity_GetRequiredForNotSatisfied;
Activity.prototype.RollupProgressCompletion = Activity_RollupProgressCompletion;
Activity.prototype.GetRequiredForCompleted = Activity_GetRequiredForCompleted;
Activity.prototype.GetRequiredForIncomplete = Activity_GetRequiredForIncomplete;
Activity.prototype.IncrementAttemptCount = Activity_IncrementAttemptCount;
Activity.prototype.SetRandomizedChildren = Activity_SetRandomizedChildren;
Activity.prototype.SetSelectedChildren = Activity_SetSelectedChildren;
Activity.prototype.GetRandomizedChildren = Activity_GetRandomizedChildren;
Activity.prototype.GetSelectedChildren = Activity_GetSelectedChildren;
Activity.prototype.GetActivityListBetweenChildren = Activity_GetActivityListBetweenChildren;
Activity.prototype.IsActivityAnAvailableChild = Activity_IsActivityAnAvailableChild;
Activity.prototype.IsActivityAnAvailableDescendent = Activity_IsActivityAnAvailableDescendent;
Activity.prototype.IsActivityTheLastAvailableChild = Activity_IsActivityTheLastAvailableChild;
Activity.prototype.IsActivityTheFirstAvailableChild = Activity_IsActivityTheFirstAvailableChild;
Activity.prototype.GetFirstAvailableChild = Activity_GetFirstAvailableChild;
Activity.prototype.GetNextActivityPreorder = Activity_GetNextActivityPreorder;
Activity.prototype.GetPreviousActivityPreorder = Activity_GetPreviousActivityPreorder;
Activity.prototype.GetNextSibling = Activity_GetNextSibling;
Activity.prototype.GetPreviousSibling = Activity_GetPreviousSibling;
Activity.prototype.InitializeAvailableChildren = Activity_InitializeAvailableChildren;
Activity.prototype.GetAvailableChildren = Activity_GetAvailableChildren;
Activity.prototype.SetAvailableChildren = Activity_SetAvailableChildren;
Activity.prototype.IsAvailable = Activity_IsAvailable;
Activity.prototype.InitializeForNewAttempt = Activity_InitializeForNewAttempt;
Activity.prototype.ResetAttemptState = Activity_ResetAttemptState;
Activity.prototype.RollupDurations = Activity_RollupDurations;
Activity.prototype.SetDirtyData = Activity_SetDirtyData;
Activity.prototype.IsAnythingDirty = Activity_IsAnythingDirty;
Activity.prototype.MarkPostedObjectiveDataDirty = Activity_MarkPostedObjectiveDataDirty;
Activity.prototype.MarkPostedObjectiveDataClean = Activity_MarkPostedObjectiveDataClean;
Activity.prototype.MarkDirtyObjectiveDataPosted = Activity_MarkDirtyObjectiveDataPosted;
Activity.prototype.SetSequencer = Activity_SetSequencer;
Activity.prototype.Clone = Activity_Clone;
Activity.prototype.TearDown = Activity_TearDown;
Activity.prototype.DisplayInChoice = Activity_DisplayInChoice;
Activity.prototype.SetHiddenFromChoice = Activity_SetHiddenFromChoice;
Activity.prototype.SetLaunchedThisSession = Activity_SetLaunchedThisSession;
Activity.prototype.WasLaunchedThisSession = Activity_WasLaunchedThisSession;
Activity.prototype.SetAttemptedDuringThisAttempt = Activity_SetAttemptedDuringThisAttempt;
Activity.prototype.WasAttemptedDuringThisAttempt = Activity_WasAttemptedDuringThisAttempt;
Activity.prototype.GetMinProgressMeasure = Activity_GetMinProgressMeasure;
Activity.prototype.GetCompletionProgressWeight = Activity_GetCompletionProgressWeight;
Activity.prototype.GetCompletedByMeasure = Activity_GetCompletedByMeasure;
Activity.prototype.GetAttemptCompletionAmount = Activity_GetAttemptCompletionAmount;
Activity.prototype.SetAttemptCompletionAmount = Activity_SetAttemptCompletionAmount;
Activity.prototype.GetAttemptCompletionAmountStatus = Activity_GetAttemptCompletionAmountStatus;
Activity.prototype.SetAttemptCompletionAmountStatus = Activity_SetAttemptCompletionAmountStatus;
Activity.prototype.GetCompletionStatusChangedDuringRuntime = Activity_GetCompletionStatusChangedDuringRuntime;
Activity.prototype.GetSuccessStatusChangedDuringRuntime = Activity_GetSuccessStatusChangedDuringRuntime;
Activity.prototype.GetActivityStartTimestampUtc = Activity_GetActivityStartTimestampUtc;
Activity.prototype.SetActivityStartTimestampUtc = Activity_SetActivityStartTimestampUtc;
Activity.prototype.GetAttemptStartTimestampUtc = Activity_GetAttemptStartTimestampUtc;
Activity.prototype.SetAttemptStartTimestampUtc = Activity_SetAttemptStartTimestampUtc;
Activity.prototype.GetActivityAbsoluteDuration = Activity_GetActivityAbsoluteDuration;
Activity.prototype.SetActivityAbsoluteDuration = Activity_SetActivityAbsoluteDuration;
Activity.prototype.GetAttemptAbsoluteDuration = Activity_GetAttemptAbsoluteDuration;
Activity.prototype.SetAttemptAbsoluteDuration = Activity_SetAttemptAbsoluteDuration;
Activity.prototype.GetActivityExperiencedDurationTracked = Activity_GetActivityExperiencedDurationTracked;
Activity.prototype.SetActivityExperiencedDurationTracked = Activity_SetActivityExperiencedDurationTracked;
Activity.prototype.GetAttemptExperiencedDurationTracked = Activity_GetAttemptExperiencedDurationTracked;
Activity.prototype.SetAttemptExperiencedDurationTracked = Activity_SetAttemptExperiencedDurationTracked;
Activity.prototype.GetActivityExperiencedDurationReported = Activity_GetActivityExperiencedDurationReported;
Activity.prototype.SetActivityExperiencedDurationReported = Activity_SetActivityExperiencedDurationReported;
Activity.prototype.GetAttemptExperiencedDurationReported = Activity_GetAttemptExperiencedDurationReported;
Activity.prototype.SetAttemptExperiencedDurationReported = Activity_SetAttemptExperiencedDurationReported;
Activity.prototype.UsesDefaultSatisfactionRollupRules = Activity_UsesDefaultSatisfactionRollupRules;
Activity.prototype.UsesDefaultCompletionRollupRules = Activity_UsesDefaultCompletionRollupRules;

function Activity_GetXml() {
    //Update duration
    //this.ActivityExperiencedDurationTracked = '';
    var _36b = new ServerFormater();
    var xml = new XmlElement("A");
    xml.AddAttribute("DI", this.DatabaseId);
    xml.AddAttribute("II", this.ItemIdentifier);
    xml.AddAttribute("APS", _36b.ConvertBoolean(this.ActivityProgressStatus));
    xml.AddAttribute("AAC", this.ActivityAttemptCount);
    xml.AddAttribute("AtPS", _36b.ConvertBoolean(this.AttemptProgressStatus));
    //xml.AddAttribute("ACS", _36b.ConvertBoolean(this.AttemptCompletionStatus));
    xml.AddAttribute("ACS", '1');
    xml.AddAttribute("ACAS", _36b.ConvertBoolean(this.AttemptCompletionAmountStatus));
    xml.AddAttribute("ACA", this.AttemptCompletionAmount);
    xml.AddAttribute("A", _36b.ConvertBoolean(this.Active));
    //xml.AddAttribute("S", _36b.ConvertBoolean(this.Suspended));
    xml.AddAttribute("S", '0');
    xml.AddAttribute("I", _36b.ConvertBoolean(this.Included));
    xml.AddAttribute("O", this.Ordinal);
    xml.AddAttribute("SC", _36b.ConvertBoolean(this.SelectedChildren));
    xml.AddAttribute("RC", _36b.ConvertBoolean(this.RandomizedChildren));
    xml.AddAttribute("PAPS", _36b.ConvertBoolean(this.PrevAttemptProgressStatus));
    xml.AddAttribute("PACS", _36b.ConvertBoolean(this.PrevAttemptCompletionStatus));
    xml.AddAttribute("ADTA", _36b.ConvertBoolean(this.AttemptedDuringThisAttempt));
    if (this.FirstCompletionTimestampUtc !== null) {
        xml.AddAttribute("FCTU", this.FirstCompletionTimestampUtc);
    }
    if (this.IsDurations) {
        if (this.ActivityStartTimestampUtc !== null) {
            xml.AddAttribute("ASTU", this.ActivityStartTimestampUtc);
        }
        if (this.AttemptStartTimestampUtc !== null) {
            xml.AddAttribute("AtSTU", this.AttemptStartTimestampUtc);
        }

        xml.AddAttribute("AAD", _36b.ConvertTimeSpan(this.ActivityAbsoluteDuration));
        xml.AddAttribute("AtAD", _36b.ConvertTimeSpan(this.AttemptAbsoluteDuration));
        xml.AddAttribute("AEDT", _36b.ConvertTimeSpan(this.ActivityExperiencedDurationTracked));
        xml.AddAttribute("AtEDT", _36b.ConvertTimeSpan(this.AttemptExperiencedDurationTracked));
        xml.AddAttribute("AEDR", _36b.ConvertTimeSpan(this.ActivityExperiencedDurationReported));
        xml.AddAttribute("AtEDR", _36b.ConvertTimeSpan(this.AttemptExperiencedDurationReported));
    }
    for (var i = 0; i < this.ActivityObjectives.length; i++) {
        xml.AddElement(this.ActivityObjectives[i].GetXml(this.DatabaseId, i));
    }
    if (this.RunTime !== null) {
        xml.AddElement(this.RunTime.GetXml(this.DatabaseId));
    }
    return xml.toString();
}

function Activity_toString() {
    var str = this.GetTitle() + " (" + this.GetItemIdentifier() + ")";
    return str;
}

function Activity_GetTitle() {
    return this.LearningObject.Title;
}

function Activity_GetItemIdentifier() {
    if (this.LearningObject.ItemIdentifier !== null && this.LearningObject.ItemIdentifier !== "") {
        return this.LearningObject.ItemIdentifier;
    } else {
        return this.DatabaseId;
    }
}

function Activity_GetDatabaseIdentifier() {
    return this.DatabaseId;
}

function Activity_GetLaunchPath() {
    return MergeQueryStringParameters(this.LearningObject.Href, this.LearningObject.Parameters);
}

function Activity_IsDeliverable() {
    return (this.RunTime !== null);
}

function Activity_TransferRteDataToActivity() {
    var _36f = this.GetObjectives();
    var _370;
    var _371 = this.GetPrimaryObjective();
    var _372 = false;
    var id;
    if (this.IsTracked()) {
        for (var i = 0; i < _36f.length; i++) {
            id = _36f[i].GetIdentifier();
            _370 = this.RunTime.FindObjectiveWithId(id);
            if (_370 !== null) {
                if (_370.SuccessStatusChangedDuringRuntime === true) {
                    if (_370.SuccessStatus == SCORM_STATUS_UNKNOWN) {
                        _36f[i].SetProgressStatus(false, false, this, true);
                    } else {
                        if (_370.SuccessStatus == SCORM_STATUS_PASSED) {
                            _36f[i].SetProgressStatus(true, false, this, true);
                            _36f[i].SetSatisfiedStatus(true, false, this);
                        } else {
                            if (_370.SuccessStatus == SCORM_STATUS_FAILED) {
                                _36f[i].SetProgressStatus(true, false, this, true);
                                _36f[i].SetSatisfiedStatus(false, false, this);
                            } else {
                                Debug.AssertError("Invalid success status (" + _370.SuccessStatus + ") encountered in a RTE objective at position " + i);
                            }
                        }
                    }
                }
                if (_370.MeasureChangedDuringRuntime === true) {
                    if (_370.ScoreScaled === null) {
                        _36f[i].SetMeasureStatus(false, this);
                    } else {
                        _36f[i].SetMeasureStatus(true, this);
                        _36f[i].SetNormalizedMeasure(_370.ScoreScaled, this);
                    }
                }
                _36f[i].SetScoreRaw(_370.ScoreRaw);
                _36f[i].SetScoreMin(_370.ScoreMin);
                _36f[i].SetScoreMax(_370.ScoreMax);
                if (_370.ProgressMeasureChangedDuringRuntime === true) {
                    if (_371.GetIdentifier() === id) {
                        _372 = true;
                        if (_370.ProgressMeasure === null) {
                            this.SetAttemptCompletionAmountStatus(false);
                        } else {
                            this.SetAttemptCompletionAmountStatus(true);
                            this.SetAttemptCompletionAmount(_370.ProgressMeasure);
                        }
                    }
                    if (_370.ProgressMeasure === null) {
                        _36f[i].SetProgressMeasureStatus(false);
                    } else {
                        _36f[i].SetProgressMeasureStatus(true);
                        _36f[i].SetProgressMeasure(_370.ProgressMeasure);
                    }
                }
                if (_370.CompletionStatusChangedDuringRuntime === true) {
                    var _375 = false;
                    var _376 = false;
                    if (_370.CompletionStatus == SCORM_STATUS_UNKNOWN) {
                        _375 = false;
                    } else {
                        if (_370.CompletionStatus == SCORM_STATUS_NOT_ATTEMPTED) {
                            _375 = true;
                            _376 = false;
                        } else {
                            if (_370.CompletionStatus == SCORM_STATUS_COMPLETED) {
                                _375 = true;
                                _376 = true;
                            } else {
                                if (_370.CompletionStatus == SCORM_STATUS_INCOMPLETE) {
                                    _375 = true;
                                    _376 = false;
                                } else {
                                    if (_370.CompletionStatus == SCORM_STATUS_BROWSED) {
                                        _375 = true;
                                        _376 = false;
                                    } else {
                                        Debug.AssertError("Invalid completion status-" + _370.CompletionStatus);
                                    }
                                }
                            }
                        }
                    }
                    _36f[i].SetCompletionStatus(_375);
                    if (_375 === true) {
                        _36f[i].SetCompletionStatusValue(_376);
                    }
                    if (_371.GetIdentifier() === id) {
                        this.SetAttemptProgressStatus(_375);
                        if (_375 === true) {
                            this.SetAttemptCompletionStatus(_376);
                        }
                    }
                }
            } else {
                if (id.length > 0) {
                    Debug.AssertError("Sequencing objective not found in runtime, id=" + _36f[i].GetIdentifier());
                }
            }
        }
        var _377;
        var _378;
        if (this.Sequencer.LookAhead === true) {
            _377 = this.RunTime.LookAheadSuccessStatus;
            _378 = this.RunTime.LookAheadCompletionStatus;
        } else {
            _377 = this.RunTime.SuccessStatus;
            _378 = this.RunTime.CompletionStatus;
        }
        if (_377 == SCORM_STATUS_UNKNOWN) {
            _371.SetProgressStatus(false, false, this);
        } else {
            if (_377 == SCORM_STATUS_PASSED) {
                _371.SetProgressStatus(true, false, this);
                _371.SetSatisfiedStatus(true, false, this);
            } else {
                if (_377 == SCORM_STATUS_FAILED) {
                    _371.SetProgressStatus(true, false, this);
                    _371.SetSatisfiedStatus(false, false, this);
                } else {
                    this.Sequencer.LogSeq("`1389`" + _377);
                }
            }
        }
        if (this.RunTime.ScoreRaw == 0 && Control.Package.Properties.ScoreRollupMode == SCORE_ROLLUP_METHOD_AVERAGE_SCORE_OF_ALL_UNITS_WITH_NONZERO_SCORES) {} else {
            if (this.RunTime.ScoreScaled === null) {
                _371.SetMeasureStatus(false, this);
                if (Control.Package.Properties.ScaleRawScore == true) {
                    var _379 = NormalizeRawScore(this.RunTime.ScoreRaw, this.RunTime.ScoreMin, this.RunTime.ScoreMax);
                    if (_379 !== null && _379 !== undefined) {
                        _371.SetMeasureStatus(true, this);
                        _371.SetNormalizedMeasure(_379, this);
                    } else {
                        this.Sequencer.LogSeq("`1041`" + this.RunTime.ScoreRaw + "`1744`" + this.RunTime.ScoreMin + "`1743`" + this.RunTime.ScoreMax);
                    }
                }
            } else {
                _371.SetMeasureStatus(true, this);
                _371.SetNormalizedMeasure(this.RunTime.ScoreScaled, this);
            }
        }
        _371.SetScoreRaw(this.RunTime.ScoreRaw);
        _371.SetScoreMin(this.RunTime.ScoreMin);
        _371.SetScoreMax(this.RunTime.ScoreMax);
        if (this.RunTime.ProgressMeasure === null) {
            if (_372 !== true) {
                this.SetAttemptCompletionAmountStatus(false);
                _371.SetProgressMeasureStatus(false);
            }
        } else {
            this.SetAttemptCompletionAmountStatus(true);
            this.SetAttemptCompletionAmount(this.RunTime.ProgressMeasure);
            _371.SetProgressMeasureStatus(true);
            _371.SetProgressMeasure(this.RunTime.ProgressMeasure);
        }
        var _37a = false;
        var _37b = false;
        if (Control.Package.LearningStandard.is20044thOrGreater() === false || this.RunTime.CompletionStatusChangedDuringRuntime === true) {
            if (_378 == SCORM_STATUS_UNKNOWN) {
                _37a = false;
                _37b = false;
            } else {
                if (_378 == SCORM_STATUS_NOT_ATTEMPTED) {
                    _37a = true;
                    _37b = false;
                } else {
                    if (_378 == SCORM_STATUS_COMPLETED) {
                        _37a = true;
                        _37b = true;
                    } else {
                        if (_378 == SCORM_STATUS_INCOMPLETE) {
                            _37a = true;
                            _37b = false;
                        } else {
                            if (_378 == SCORM_STATUS_BROWSED) {
                                _37a = true;
                                _37b = false;
                            } else {
                                Debug.AssertError("Invalid completion status-" + _378);
                            }
                        }
                    }
                }
            }
            this.SetAttemptProgressStatus(_37a);
            if (_37a === true) {
                this.SetAttemptCompletionStatus(_37b);
            }
        }
        if (this.LookAheadActivity === false) {
            this.SetDirtyData();
        }
    } else {}
}

function Activity_IsTheRoot() {
    var _37c = this.ParentActivity;
    var _37d = (_37c === null);
    return _37d;
}

function Activity_IsALeaf() {
    if (this.ChildActivities.length === 0) {
        return true;
    } else {
        return false;
    }
}

function Activity_IsActive() {
    var _37e;
    _37e = this.Active;
    return _37e;
}

function Activity_IsSuspended() {
    var _37f;
    _37f = this.Suspended;
    return _37f;
}

function Activity_HasSuspendedChildren() {
    var _380 = this.GetChildren();
    for (var i = 0; i < _380.length; i++) {
        if (_380[i].IsSuspended()) {
            return true;
        }
    }
    return false;
}

function Activity_SetActive(_382) {
    this.Active = _382;
    this.SetDirtyData();
}

function Activity_SetSuspended(_383) {
    this.Suspended = _383;
    this.SetDirtyData();
}

function Activity_IsTracked() {
    var _384 = this.LearningObject.SequencingData.Tracked;
    return _384;
}

function Activity_IsCompletionSetByContent() {
    var _385 = false;
    if (Control.Package.Properties.ForceObjectiveCompletionSetByContent == true) {
        _385 = true;
    } else {
        _385 = this.LearningObject.SequencingData.CompletionSetByContent;
    }
    return _385;
}

function Activity_IsObjectiveSetByContent() {
    var _386 = false;
    if (Control.Package.Properties.ForceObjectiveCompletionSetByContent == true) {
        _386 = true;
    } else {
        _386 = this.LearningObject.SequencingData.ObjectiveSetByContent;
    }
    return _386;
}

function Activity_GetAttemptProgressStatus() {
    if (this.IsTracked() === false) {
        return false;
    }
    var _387 = this.AttemptProgressStatus;
    return _387;
}

function Activity_SetAttemptProgressStatus(_388) {
    this.AttemptProgressStatus = _388;
    if (_388 === true) {
        this.SetAttemptedDuringThisAttempt();
    }
    var _389 = this.GetPrimaryObjective();
    _389.SetCompletionStatus(_388);
    this.SetDirtyData();
}

function Activity_SetAttemptCompletionStatus(_38a) {
    if (this.FirstCompletionTimestampUtc === null && _38a === true) {
        this.FirstCompletionTimestampUtc = ConvertDateToIso8601String(new Date());
    }
    this.AttemptCompletionStatus = _38a;
    var _38b = this.GetPrimaryObjective();
    _38b.SetCompletionStatusValue(_38a);
    this.SetDirtyData();
}

function Activity_GetAttemptCompletionStatus() {
    if (this.IsTracked() === false) {
        return false;
    }
    var _38c = this.AttemptCompletionStatus;
    return _38c;
}

function Activity_GetChildren() {
    return this.ChildActivities;
}

function Activity_GetSequencingControlFlow() {
    var _38d = this.LearningObject.SequencingData.ControlFlow;
    return _38d;
}

function Activity_GetSequencingControlChoice() {
    var _38e = this.LearningObject.SequencingData.ControlChoice;
    return _38e;
}

function Activity_GetSequencingControlChoiceExit() {
    var _38f = this.LearningObject.SequencingData.ControlChoiceExit;
    return _38f;
}

function Activity_GetSequencingControlForwardOnly() {
    var _390 = this.LearningObject.SequencingData.ControlForwardOnly;
    return _390;
}

function Activity_GetPreventActivation() {
    var _391 = this.LearningObject.SequencingData.PreventActivation;
    return _391;
}

function Activity_GetConstrainedChoice() {
    var _392 = this.LearningObject.SequencingData.ConstrainChoice;
    return _392;
}

function Activity_GetSelectionTiming() {
    var _393 = this.LearningObject.SequencingData.SelectionTiming;
    return _393;
}

function Activity_GetSelectionCountStatus() {
    var _394 = this.LearningObject.SequencingData.SelectionCountStatus;
    return _394;
}

function Activity_GetSelectionCount() {
    var _395 = this.LearningObject.SequencingData.SelectionCount;
    return _395;
}

function Activity_GetRandomizationTiming() {
    var _396 = this.LearningObject.SequencingData.RandomizationTiming;
    return _396;
}

function Activity_GetRandomizeChildren() {
    var _397 = this.LearningObject.SequencingData.RandomizeChildren;
    return _397;
}

function Activity_GetLimitConditionAttemptControl() {
    var _398 = this.LearningObject.SequencingData.LimitConditionAttemptControl;
    return _398;
}

function Activity_GetActivityProgressStatus() {
    if (this.IsTracked() === false) {
        return false;
    }
    var _399 = this.ActivityProgressStatus;
    return _399;
}

function Activity_SetActivityProgressStatus(_39a) {
    this.ActivityProgressStatus = _39a;
    this.SetDirtyData();
}

function Activity_GetAttemptCount() {
    var _39b = this.ActivityAttemptCount;
    return _39b;
}

function Activity_GetLimitConditionAttemptLimit() {
    var _39c = this.LearningObject.SequencingData.LimitConditionAttemptLimit;
    return _39c;
}

function Activity_GetPreConditionRules() {
    var _39d = this.LearningObject.SequencingData.PreConditionSequencingRules;
    return _39d;
}

function Activity_GetPostConditionRules() {
    var _39e = this.LearningObject.SequencingData.PostConditionSequencingRules;
    return _39e;
}

function Activity_GetExitRules() {
    var _39f = this.LearningObject.SequencingData.ExitSequencingRules;
    return _39f;
}

function Activity_IsSatisfied(_3a0, _3a1) {
    if (_3a1 === null || _3a1 === undefined) {
        _3a1 = false;
    }
    if (this.IsTracked() === false) {
        return RESULT_UNKNOWN;
    }
    var _3a2;
    if (_3a0 === "" || _3a0 === undefined || _3a0 === null) {
        _3a2 = this.GetPrimaryObjective();
    } else {
        _3a2 = this.FindObjective(_3a0);
    }
    if (_3a2 === null || _3a2 === undefined) {
        Debug.AssertError("Sequencing rule references a bad objective.");
    }
    if (_3a2.GetProgressStatus(this, _3a1) === true) {
        if (_3a2.GetSatisfiedStatus(this, _3a1) === true) {
            return true;
        } else {
            return false;
        }
    } else {
        return RESULT_UNKNOWN;
    }
}

function Activity_IsObjectiveStatusKnown(_3a3, _3a4) {
    if (_3a4 === null || _3a4 === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into IsObjectiveStatusKnown");
    }
    if (this.IsTracked() === false) {
        return false;
    }
    var _3a5 = this.FindObjective(_3a3);
    if (_3a5.GetProgressStatus(this, _3a4) === true) {
        return true;
    } else {
        return false;
    }
}

function Activity_IsObjectiveMeasureKnown(_3a6, _3a7) {
    if (_3a7 === null || _3a7 === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into IsObjectiveMeasureKnown");
    }
    if (this.IsTracked() === false) {
        return false;
    }
    var _3a8 = this.FindObjective(_3a6);
    if (_3a8.GetMeasureStatus(this, _3a7) === true) {
        return true;
    } else {
        return false;
    }
}

function Activity_IsObjectiveMeasureGreaterThan(_3a9, _3aa, _3ab) {
    if (_3ab === null || _3ab === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into IsObjectiveMeasureGreaterThan");
    }
    if (this.IsTracked() === false) {
        return RESULT_UNKNOWN;
    }
    var _3ac = this.FindObjective(_3a9);
    if (_3ac.GetMeasureStatus(this, _3ab) === true) {
        if (_3ac.GetNormalizedMeasure(this, _3ab) > _3aa) {
            return true;
        } else {
            return false;
        }
    } else {
        return RESULT_UNKNOWN;
    }
}

function Activity_IsObjectiveMeasureLessThan(_3ad, _3ae, _3af) {
    if (_3af === null || _3af === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into IsObjectiveMeasureLessThan");
    }
    if (this.IsTracked() === false) {
        return RESULT_UNKNOWN;
    }
    var _3b0 = this.FindObjective(_3ad);
    Debug.AssertError("The objective referenced by a sequencing rule was not found. Does the definition of the sequencing rule in the manifest erroneously reference the name of the global objective instead of the local name of the objective? Problematic reference=" + _3ad, (_3b0 === null));
    if (_3b0.GetMeasureStatus(this, _3af) === true) {
        if (_3b0.GetNormalizedMeasure(this, _3af) < _3ae) {
            return true;
        } else {
            return false;
        }
    } else {
        return RESULT_UNKNOWN;
    }
}

function Activity_GetObjectiveMeasure(_3b1) {
    if (_3b1 === null || _3b1 === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into GetObjectiveMeasure");
    }
    if (this.IsTracked() === false) {
        return RESULT_UNKNOWN;
    }
    var _3b2 = this.GetPrimaryObjective();
    if (_3b2.GetMeasureStatus(this, _3b1) === true) {
        return _3b2.GetNormalizedMeasure(this, _3b1);
    } else {
        return RESULT_UNKNOWN;
    }
}

function Activity_IsCompleted(_3b3, _3b4) {
    if (_3b4 === null || _3b4 === undefined) {
        _3b4 = false;
    }
    if (this.IsTracked() === false) {
        return RESULT_UNKNOWN;
    }
    var _3b5 = false;
    var _3b6 = false;
    if (Control.Package.LearningStandard.is20044thOrGreater()) {
        _3b5 = true;
    }
    if (Control.Package.LearningStandard.is20044thOrGreater() === true && this.GetCompletedByMeasure() === true) {
        _3b6 = true;
    }
    var _3b7;
    var _3b8;
    var _3b9;
    var _3ba;
    var _3bb = null;
    if (_3b5 === true && _3b3 !== "" && _3b3 !== undefined && _3b3 !== null) {
        _3bb = this.FindObjective(_3b3);
        if (_3bb === null || _3bb === undefined) {
            Debug.AssertError("Sequencing rule references a bad objective.");
        }
    }
    if (_3b5 === true && _3bb !== null && _3bb !== undefined) {
        _3b7 = _3bb.GetCompletionStatus(this, _3b4);
        _3b8 = _3bb.GetCompletionStatusValue(this, _3b4);
        if (_3b6 === true) {
            _3b9 = _3bb.GetProgressMeasureStatus();
            _3ba = _3bb.GetProgressMeasure();
        }
    } else {
        var _3bc = this.GetPrimaryObjective();
        var _3bd = _3bc.GetMaps("ReadCompletionStatus", true);
        if (_3b5 === true && _3bd.length > 0) {
            _3b7 = _3bc.GetCompletionStatus(this, _3b4);
            _3b8 = _3bc.GetCompletionStatusValue(this, _3b4);
            if (_3b6 === true) {
                _3b9 = _3bc.GetProgressMeasureStatus();
                _3ba = _3bc.GetProgressMeasure();
            }
        } else {
            if (_3b4 === true && this.WasAttemptedDuringThisAttempt() === false) {
                _3b7 = this.PrevAttemptProgressStatus;
                _3b8 = this.PrevAttemptCompletionStatus;
            } else {
                _3b7 = this.AttemptProgressStatus;
                _3b8 = this.AttemptCompletionStatus;
            }
            if (_3b6 === true) {
                _3b9 = this.GetAttemptCompletionAmountStatus();
                _3ba = this.GetAttemptCompletionAmount();
            }
        }
    }
    if (_3b6 === true && (this.IsActive() === false || this.GetMeasureSatisfactionIfActive() === true)) {
        if (_3b9 === true) {
            if (_3ba >= this.GetMinProgressMeasure()) {
                return true;
            } else {
                return false;
            }
        } else {
            return RESULT_UNKNOWN;
        }
    }
    if (_3b7 === true) {
        if (_3b8 === true) {
            return true;
        } else {
            return false;
        }
    } else {
        return RESULT_UNKNOWN;
    }
}

function Activity_IsActivityProgressKnown(_3be, _3bf) {
    if (_3bf === null || _3bf === undefined) {
        Debug.AssertError("ERROR - canLookAtPreviousAttempt must be passed into IsActivityProgressKnown");
    }
    if (this.IsTracked() === false) {
        return false;
    }
    var _3c0 = false;
    if (Control.Package.LearningStandard.is20044thOrGreater()) {
        _3c0 = true;
    }
    var _3c1 = this.ActivityProgressStatus;
    var _3c2;
    var _3c3;
    var _3c4 = null;
    if (Control.Package.LearningStandard.is20044thOrGreater() === true && this.GetCompletedByMeasure() === true) {
        _3c2 = this.GetAttemptCompletionAmountStatus();
    } else {
        if (_3c0 === true && _3be !== "" && _3be !== undefined && _3be !== null) {
            _3c4 = this.FindObjective(_3be);
            if (_3c4 === null || _3c4 === undefined) {
                Debug.AssertError("Sequencing rule references a bad objective.");
            }
        }
        if (_3c0 === true && _3c4 !== null && _3c4 !== undefined) {
            _3c2 = _3c4.GetCompletionStatus(this, _3bf);
        } else {
            var _3c5 = this.GetPrimaryObjective();
            var _3c6 = _3c5.GetMaps("ReadCompletionStatus", true);
            if (_3c0 === true && _3c6.length > 0) {
                _3c2 = _3c5.GetCompletionStatus(this, _3bf);
            } else {
                if (_3bf === true && this.WasAttemptedDuringThisAttempt() === false) {
                    _3c2 = this.PrevAttemptProgressStatus;
                } else {
                    _3c2 = this.AttemptProgressStatus;
                }
            }
        }
    }
    if (_3c0 === true) {
        return _3c2;
    } else {
        return (_3c2 === true && _3c1 === true) ? true : false;
    }
}

function Activity_IsAttempted() {
    if (this.IsTracked() === false) {
        return RESULT_UNKNOWN;
    }
    if (this.ActivityProgressStatus === true || Control.Package.LearningStandard.is20044thOrGreater() === true) {
        if (this.GetAttemptCount() > 0) {
            return true;
        }
    } else {
        return RESULT_UNKNOWN;
    }
    return false;
}

function Activity_IsAttemptLimitExceeded() {
    if (this.IsTracked() === false) {
        return RESULT_UNKNOWN;
    }
    if (this.IsActive() || this.IsSuspended()) {
        return false;
    }
    if (this.ActivityProgressStatus === true) {
        if (this.GetLimitConditionAttemptControl() === true) {
            if (this.GetAttemptCount() >= this.GetLimitConditionAttemptLimit()) {
                return true;
            }
        }
    } else {
        return RESULT_UNKNOWN;
    }
    return false;
}

function Activity_GetObjectives() {
    return this.ActivityObjectives;
}

function Activity_FindObjective(_3c7) {
    var _3c8 = this.GetObjectives();
    for (var i = 0; i < _3c8.length; i++) {
        if (_3c7 === "" || _3c7 === null) {
            if (_3c8[i].GetContributesToRollup() === true) {
                return _3c8[i];
            }
        } else {
            if (_3c8[i].GetIdentifier() == _3c7) {
                return _3c8[i];
            }
        }
    }
    return null;
}

function Activity_GetPrimaryObjective() {
    if (this.CachedPrimaryObjective === null) {
        var _3ca = null;
        var _3cb = this.GetObjectives();
        for (var i = 0; i < _3cb.length; i++) {
            if (_3cb[i].GetContributesToRollup() === true) {
                _3ca = _3cb[i];
                break;
            }
        }
        this.CachedPrimaryObjective = _3ca;
    }
    if (this.CachedPrimaryObjective === null) {
        Debug.AssertError("Could not find a primary objective.");
    }
    return this.CachedPrimaryObjective;
}

function Activity_GetRollupObjectiveMeasureWeight() {
    var _3cd = this.LearningObject.SequencingData.RollupObjectiveMeasureWeight;
    _3cd = parseFloat(_3cd);
    return _3cd;
}

function Activity_GetMeasureSatisfactionIfActive() {
    var _3ce = this.LearningObject.SequencingData.MeasureSatisfactionIfActive;
    return _3ce;
}

function Activity_GetRollupRules() {
    var _3cf = this.LearningObject.SequencingData.RollupRules;
    return _3cf;
}

function Activity_ApplyRollupRule(_3d0) {
    if (_3d0.Action == RULE_SET_SATISFIED || _3d0.Action == RULE_SET_NOT_SATISFIED) {
        this.LearningObject.UsesDefaultSatisfactionRollupRules = true;
    } else {
        this.LearningObject.UsesDefaultCompletionRollupRules = true;
    }
    var _3d1 = this.LearningObject.SequencingData.RollupRules.length;
    this.LearningObject.SequencingData.RollupRules[_3d1] = _3d0;
}

function Activity_GetRollupObjectiveSatisfied() {
    var _3d2 = this.LearningObject.SequencingData.RollupObjectiveSatisfied;
    return _3d2;
}

function Activity_GetRequiredForSatisfied() {
    var _3d3 = this.LearningObject.SequencingData.RequiredForSatisfied;
    return _3d3;
}

function Activity_GetRequiredForNotSatisfied() {
    var _3d4 = this.LearningObject.SequencingData.RequiredForNotSatisfied;
    return _3d4;
}

function Activity_RollupProgressCompletion() {
    var _3d5 = this.LearningObject.SequencingData.RollupProgressCompletion;
    return _3d5;
}

function Activity_GetRequiredForCompleted() {
    var _3d6 = this.LearningObject.SequencingData.RequiredForCompleted;
    return _3d6;
}

function Activity_GetRequiredForIncomplete() {
    var _3d7 = this.LearningObject.SequencingData.RequiredForIncomplete;
    return _3d7;
}

function Activity_IncrementAttemptCount() {
    this.ActivityAttemptCount++;
}

function Activity_SetRandomizedChildren(_3d8) {
    this.RandomizedChildren = _3d8;
    this.SetDirtyData();
}

function Activity_SetSelectedChildren(_3d9) {
    this.SelectedChildren = _3d9;
    this.SetDirtyData();
}

function Activity_GetRandomizedChildren() {
    var _3da = this.RandomizedChildren;
    return _3da;
}

function Activity_GetSelectedChildren() {
    var _3db = this.SelectedChildren;
    return _3db;
}

function Activity_GetActivityListBetweenChildren(_3dc, _3dd, _3de) {
    var _3df = this.GetAvailableChildren();
    var _3e0 = new Array();
    var _3e1 = null;
    var _3e2 = null;
    for (var i = 0; i < _3df.length; i++) {
        if (_3dc == _3df[i]) {
            _3e1 = i;
        }
        if (_3dd == _3df[i]) {
            _3e2 = i;
        }
    }
    if (_3e1 == _3e2) {
        if (_3de) {
            _3e0[0] = _3df[_3e1];
        }
    } else {
        if (_3e1 < _3e2) {
            if (_3de) {
                _3e2++;
            }
            _3e0 = _3df.slice(_3e1, _3e2);
        } else {
            if (_3e1 > _3e2) {
                if (!_3de) {
                    _3e2++;
                }
                _3e0 = _3df.slice(_3e2, _3e1 + 1);
            }
        }
    }
    return _3e0;
}

function Activity_IsActivityAnAvailableChild(_3e4) {
    var _3e5 = this.GetAvailableChildren();
    for (var i = 0; i < _3e5.length; i++) {
        if (_3e5[i] == _3e4) {
            return true;
        }
    }
    return false;
}

function Activity_IsActivityAnAvailableDescendent(_3e7) {
    return Activity_SearchAllAvailableDescendents(this, _3e7);
}

function Activity_SearchAllAvailableDescendents(_3e8, _3e9) {
    var _3ea = _3e8.GetAvailableChildren();
    for (var i = 0; i < _3ea.length; i++) {
        if (_3ea[i] == _3e9) {
            return true;
        }
        if (Activity_SearchAllAvailableDescendents(_3ea[i], _3e9)) {
            return true;
        }
    }
    return false;
}

function Activity_IsActivityTheLastAvailableChild(_3ec) {
    var _3ed = this.GetAvailableChildren();
    if (_3ed[_3ed.length - 1] == _3ec) {
        return true;
    }
    return false;
}

function Activity_IsActivityTheFirstAvailableChild(_3ee) {
    var _3ef = this.GetAvailableChildren();
    if (_3ef[0] == _3ee) {
        return true;
    }
    return false;
}

function Activity_GetFirstAvailableChild() {
    var _3f0 = this.GetAvailableChildren();
    return _3f0[0];
}

function Activity_GetNextActivityPreorder() {
    var _3f1 = this.GetAvailableChildren();
    if (_3f1.length !== 0) {
        return _3f1[0];
    }
    for (var _3f2 = this; _3f2.ParentActivity !== null; _3f2 = _3f2.ParentActivity) {
        var _3f3 = _3f2.GetNextSibling();
        if (_3f3 !== null) {
            return _3f3;
        }
    }
    return null;
}

function Activity_GetPreviousActivityPreorder() {
    var _3f4 = this.GetPreviousSibling();
    if (_3f4 === null) {
        return this.ParentActivity;
    }
    var _3f5 = _3f4.GetAvailableChildren();
    while (_3f5.length > 0) {
        _3f4 = _3f5[_3f5.length - 1];
        _3f5 = _3f4.GetAvailableChildren();
    }
    return _3f4;
}

function Activity_GetNextSibling() {
    var _3f6 = null;
    var _3f7 = this.ParentActivity;
    if (_3f7 === null) {
        return null;
    }
    var _3f8 = _3f7.GetAvailableChildren();
    for (var i = 0; i < _3f8.length; i++) {
        if (_3f8[i] == this) {
            _3f6 = i;
            break;
        }
    }
    if (_3f6 !== null && _3f6 < (_3f8.length - 1)) {
        return _3f8[_3f6 + 1];
    }
    return null;
}

function Activity_GetPreviousSibling() {
    var _3fa = null;
    var _3fb = this.ParentActivity;
    if (_3fb === null) {
        return null;
    }
    var _3fc = _3fb.GetAvailableChildren();
    for (var i = 0; i < _3fc.length; i++) {
        if (_3fc[i] == this) {
            _3fa = i;
            break;
        }
    }
    if (_3fa !== null && _3fa > 0) {
        return _3fc[_3fa - 1];
    }
    return null;
}

function Activity_InitializeAvailableChildren() {
    var _3fe = this.GetChildren();
    var _3ff = new Array();
    for (var i = 0; i < _3fe.length; i++) {
        if (_3fe[i].Included === true) {
            _3ff[_3ff.length] = _3fe[i];
        }
    }
    if (_3ff.length === 0) {
        this.SetAvailableChildren(_3fe);
    } else {
        _3ff.sort(function(_401, _402) {
            var _403 = _401.Ordinal;
            var _404 = _402.Ordinal;
            if (_403 < _404) {
                return -1;
            }
            if (_403 > _404) {
                return 1;
            }
            return 0;
        });
        this.SetAvailableChildren(_3ff);
    }
}

function Activity_GetAvailableChildren() {
    if (this.AvailableChildren === null) {
        this.InitializeAvailableChildren();
    }
    return this.AvailableChildren;
}

function Activity_SetAvailableChildren(_405) {
    this.AvailableChildren = _405;
    var _406 = this.GetChildren();
    var i;
    for (i = 0; i < _406.length; i++) {
        _406[i].Ordinal = 0;
        _406[i].Included = false;
    }
    for (i = 0; i < this.AvailableChildren.length; i++) {
        this.AvailableChildren[i].Ordinal = (i + 1);
        this.AvailableChildren[i].Included = true;
    }
    this.SetDirtyData();
}

function Activity_IsAvailable() {
    return this.Included;
}

function Activity_InitializeForNewAttempt(_408, _409) {
    var i;
    this.AttemptedDuringThisAttempt = false;
    var _40b = this.GetObjectives();
    if (_408 && this.LearningObject.SequencingData.UseCurrentAttemptObjectiveInformation === true) {
        _408 = true;
        for (i = 0; i < _40b.length; i++) {
            _40b[i].ResetAttemptState();
        }
    } else {
        _408 = false;
    }
    if (_409 && this.LearningObject.SequencingData.UseCurrentAttemptProgressInformation === true) {
        _409 = true;
        this.ResetAttemptState();
    } else {
        _409 = false;
    }
    var _40c = this.GetChildren();
    for (i = 0; i < _40c.length; i++) {
        _40c[i].InitializeForNewAttempt(_408, _409);
    }
    if (SSP_ENABLED && Control.Api.SSPApi) {
        Control.Api.SSPApi.ResetBucketsForActivity(this.DatabaseId);
    }
    this.SetDirtyData();
}

function Activity_ResetAttemptState() {
    this.PrevAttemptProgressStatus = this.AttemptProgressStatus;
    this.PrevAttemptCompletionStatus = this.AttemptCompletionStatus;
    this.AttemptProgressStatus = false;
    this.AttemptCompletionAmountStatus = false;
    this.AttemptCompletionAmount = 0;
    this.AttemptCompletionStatus = false;
    this.SetDirtyData();
}

function Activity_RollupDurations() {
    var _40d = null;
    var _40e = null;
    var _40f = null;
    var _410 = null;
    var _411 = 0;
    var _412 = 0;
    var _413 = 0;
    var _414 = 0;
    var _415 = this.GetChildren();
    for (var i = 0; i < _415.length; i++) {
        if (_415[i].GetActivityStartTimestampUtc()) {
            if (!_40d || _415[i].GetActivityStartTimestampUtc() < _40d) {
                _40d = _415[i].GetActivityStartTimestampUtc();
            }
        }
        if (_415[i].ActivityEndedDate) {
            if (!_40f || _415[i].ActivityEndedDate > _40f) {
                _40f = _415[i].ActivityEndedDate;
            }
        }
        if (_415[i].GetActivityExperiencedDurationTracked()) {
            _411 += ConvertIso8601TimeSpanToHundredths(_415[i].GetActivityExperiencedDurationTracked());
        }
        if (_415[i].GetActivityExperiencedDurationReported()) {
            _412 += ConvertIso8601TimeSpanToHundredths(_415[i].GetActivityExperiencedDurationReported());
        }
        if (!this.GetAttemptStartTimestampUtc() || (_415[i].GetAttemptStartTimestampUtc() && _415[i].GetAttemptStartTimestampUtc() >= this.GetAttemptStartTimestampUtc())) {
            if (!this.GetAttemptStartTimestampUtc() && _415[i].GetAttemptStartTimestampUtc()) {
                if (!_40e || _415[i].GetAttemptStartTimestampUtc() < _40e) {
                    _40e = _415[i].GetAttemptStartTimestampUtc();
                }
            }
            if (_415[i].ActivityEndedDate) {
                if (!_410 || _415[i].ActivityEndedDate > _410) {
                    _410 = _415[i].ActivityEndedDate;
                }
            }
            if (_415[i].GetAttemptExperiencedDurationTracked()) {
                _413 += ConvertIso8601TimeSpanToHundredths(_415[i].GetAttemptExperiencedDurationTracked());
            }
            if (_415[i].GetAttemptExperiencedDurationReported()) {
                _414 += ConvertIso8601TimeSpanToHundredths(_415[i].GetAttemptExperiencedDurationReported());
            }
        }
    }
    if (!this.IsALeaf() && _40d !== null) {
        this.SetActivityStartTimestampUtc(_40d);
        if (!this.GetAttemptStartTimestampUtc()) {
            this.SetAttemptStartTimestampUtc(_40e);
        }
        this.ActivityEndedDate = _40f;
        var _417 = GetDateFromUtcIso8601Time(this.GetActivityStartTimestampUtc());
        var _418 = GetDateFromUtcIso8601Time(this.GetAttemptStartTimestampUtc());
        this.SetActivityAbsoluteDuration(ConvertHundredthsToIso8601TimeSpan((_40f - _417) / 10));
        this.SetAttemptAbsoluteDuration(ConvertHundredthsToIso8601TimeSpan((_410 - _418) / 10));
        this.SetActivityExperiencedDurationTracked(ConvertHundredthsToIso8601TimeSpan(_411));
        this.SetActivityExperiencedDurationReported(ConvertHundredthsToIso8601TimeSpan(_412));
        this.SetAttemptExperiencedDurationTracked(ConvertHundredthsToIso8601TimeSpan(_413));
        this.SetAttemptExperiencedDurationReported(ConvertHundredthsToIso8601TimeSpan(_414));
    }
}

function Activity_SetDirtyData() {
    this.DataState = DATA_STATE_DIRTY;
}

function Activity_IsAnythingDirty() {
    if (this.DataState == DATA_STATE_DIRTY) {
        return true;
    }
    for (var i = 0; i < this.ActivityObjectives.length; i++) {
        if (this.ActivityObjectives[i].DataState == DATA_STATE_DIRTY) {
            return true;
        }
    }
    return false;
}

function Activity_MarkPostedObjectiveDataDirty() {
    for (var i = 0; i < this.ActivityObjectives.length; i++) {
        if (this.ActivityObjectives[i].DataState == DATA_STATE_POSTED) {
            this.ActivityObjectives[i].SetDirtyData();
        }
    }
}

function Activity_MarkPostedObjectiveDataClean() {
    for (var i = 0; i < this.ActivityObjectives.length; i++) {
        if (this.ActivityObjectives[i].DataState == DATA_STATE_POSTED) {
            this.ActivityObjectives[i].DataState = DATA_STATE_CLEAN;
        }
    }
}

function Activity_MarkDirtyObjectiveDataPosted() {
    for (var i = 0; i < this.ActivityObjectives.length; i++) {
        if (this.ActivityObjectives[i].DataState == DATA_STATE_DIRTY) {
            this.ActivityObjectives[i].DataState = DATA_STATE_POSTED;
        }
    }
}

function Activity_SetSequencer(_41d, _41e) {
    this.Sequencer = _41d;
    this.LookAheadActivity = _41e;
    for (var i = 0; i < this.ActivityObjectives.length; i++) {
        this.ActivityObjectives[i].SetSequencer(_41d);
    }
}

function Activity_Clone() {
    var _420 = new Activity(this.DatabaseId, this.ItemIdentifier, this.ScormObjectDatabaseId, this.ActivityProgressStatus, this.ActivityAttemptCount, this.AttemptProgressStatus, this.AttemptCompletionAmountStatus, this.AttemptCompletionAmount, this.AttemptCompletionStatus, this.Active, this.Suspended, this.Included, this.Ordinal, this.SelectedChildren, this.RandomizedChildren, null, null, this.PrevAttemptProgressStatus, this.PrevAttemptCompletionStatus, this.AttemptedDuringThisAttempt, this.FirstCompletionTimestampUtc, this.ActivityStartTimestampUtc, this.AttemptStartTimestampUtc, this.ActivityAbsoluteDuration, this.AttemptAbsoluteDuration, this.ActivityExperiencedDurationTracked, this.AttemptExperiencedDurationTracked, this.ActivityExperiencedDurationReported, this.AttemptExperiencedDurationReported);
    _420.StringIdentifier = this.toString();
    _420.ActivityObjectives = new Array();
    for (var _421 in this.ActivityObjectives) {
        _420.ActivityObjectives[_421] = this.ActivityObjectives[_421].Clone();
    }
    _420.RunTime = this.RunTime;
    _420.LearningObject = this.LearningObject;
    _420.DataState = DATA_STATE_CLEAN;
    _420.LaunchedThisSession = this.LaunchedThisSession;
    _420.AttemptedDuringThisAttempt = this.AttemptedDuringThisAttempt;
    _420.UsesDefaultRollupRules = this.UsesDefaultRollupRules;
    return _420;
}

function Activity_TearDown() {
    this.StringIdentifier = null;
    this.DatabaseId = null;
    this.ScormObjectDatabaseId = null;
    this.ActivityProgressStatus = null;
    this.ActivityAttemptCount = null;
    this.AttemptProgressStatus = null;
    this.AttemptCompletionAmountStatus = null;
    this.AttemptCompletionAmount = null;
    this.AttemptCompletionStatus = null;
    this.FirstCompletionTimestampUtc = null;
    this.ActivityStartTimestampUtc = null;
    this.AttemptStartTimestampUtc = null;
    this.ActivityAbsoluteDuration = null;
    this.AttemptAbsoluteDuration = null;
    this.ActivityExperiencedDurationTracked = null;
    this.AttemptExperiencedDurationTracked = null;
    this.ActivityExperiencedDurationReported = null;
    this.AttemptExperiencedDurationReported = null;
    this.Active = null;
    this.Suspended = null;
    this.Included = null;
    this.Ordinal = null;
    this.SelectedChildren = null;
    this.RandomizedChildren = null;
    this.RunTime = null;
    this.Sequencer = null;
    this.LookAheadActivity = null;
    this.LearningObject = null;
    this.ParentActivity = null;
    this.AvailableChildren = null;
    this.DataState = null;
    this.MenuItem = null;
    this.ChildActivities = null;
    this.CachedPrimaryObjective = null;
    this.HiddenFromChoice = null;
    for (var _422 in this.ActivityObjectives) {
        this.ActivityObjectives[_422].TearDown();
        this.ActivityObjectives[_422] = null;
    }
    this.ActivityObjectives = null;
}

function Activity_DisplayInChoice() {
    if (this.LearningObject.Visible === false) {
        return false;
    } else {
        if (this.IsAvailable() === false) {
            return false;
        } else {
            if (this.HiddenFromChoice === true) {
                return false;
            }
        }
    }
    return true;
}

function Activity_SetHiddenFromChoice(_423) {
    this.HiddenFromChoice = _423;
}

function Activity_WasLaunchedThisSession() {
    return this.LaunchedThisSession;
}

function Activity_SetLaunchedThisSession() {
    this.LaunchedThisSession = true;
    if (this.LearningObject.ScormType === SCORM_TYPE_ASSET) {
        Control.ScoLoader.ScoLoaded = true;
    }
}

function Activity_WasAttemptedDuringThisAttempt() {
    return this.AttemptedDuringThisAttempt;
}

function Activity_SetAttemptedDuringThisAttempt() {
    this.AttemptedDuringThisAttempt = true;
}

function Activity_GetMinProgressMeasure() {
    return this.LearningObject.CompletionThreshold;
}

function Activity_GetCompletionProgressWeight() {
    var _424 = this.LearningObject.CompletionProgressWeight;
    _424 = parseFloat(_424);
    return _424;
}

function Activity_GetCompletedByMeasure() {
    return this.LearningObject.CompletedByMeasure;
}

function Activity_GetAttemptCompletionAmount() {
    return this.AttemptCompletionAmount;
}

function Activity_SetAttemptCompletionAmount(_425) {
    this.AttemptCompletionAmount = _425;
}

function Activity_GetAttemptCompletionAmountStatus() {
    return this.AttemptCompletionAmountStatus;
}

function Activity_SetAttemptCompletionAmountStatus(_426) {
    this.AttemptCompletionAmountStatus = _426;
}

function Activity_GetCompletionStatusChangedDuringRuntime() {
    if (this.RunTime !== null) {
        return this.RunTime.CompletionStatusChangedDuringRuntime;
    }
    return false;
}

function Activity_GetSuccessStatusChangedDuringRuntime() {
    if (this.RunTime !== null) {
        return this.RunTime.SuccessStatusChangedDuringRuntime;
    }
    return false;
}

function Activity_GetActivityStartTimestampUtc() {
    return this.ActivityStartTimestampUtc;
}

function Activity_SetActivityStartTimestampUtc(_427) {
    this.ActivityStartTimestampUtc = _427;
    this.SetDirtyData();
}

function Activity_GetAttemptStartTimestampUtc() {
    return this.AttemptStartTimestampUtc;
}

function Activity_SetAttemptStartTimestampUtc(_428) {
    this.AttemptStartTimestampUtc = _428;
    this.SetDirtyData();
}

function Activity_GetActivityAbsoluteDuration() {
    return this.ActivityAbsoluteDuration;
}

function Activity_SetActivityAbsoluteDuration(_429) {
    this.ActivityAbsoluteDuration = _429;
    this.SetDirtyData();
}

function Activity_GetAttemptAbsoluteDuration() {
    return this.AttemptAbsoluteDuration;
}

function Activity_SetAttemptAbsoluteDuration(_42a) {
    this.AttemptAbsoluteDuration = _42a;
    this.SetDirtyData();
}

function Activity_GetActivityExperiencedDurationTracked() {
    return this.ActivityExperiencedDurationTracked;
}

function Activity_SetActivityExperiencedDurationTracked(_42b) {
    this.ActivityExperiencedDurationTracked = _42b;
    this.SetDirtyData();
}

function Activity_GetAttemptExperiencedDurationTracked() {
    return this.AttemptExperiencedDurationTracked;
}

function Activity_SetAttemptExperiencedDurationTracked(_42c) {
    this.AttemptExperiencedDurationTracked = _42c;
    this.SetDirtyData();
}

function Activity_GetActivityExperiencedDurationReported() {
    return this.ActivityExperiencedDurationReported;
}

function Activity_SetActivityExperiencedDurationReported(_42d) {
    this.ActivityExperiencedDurationReported = _42d;
    this.SetDirtyData();
}

function Activity_GetAttemptExperiencedDurationReported() {
    return this.AttemptExperiencedDurationReported;
}

function Activity_SetAttemptExperiencedDurationReported(_42e) {
    this.AttemptExperiencedDurationReported = _42e;
    this.SetDirtyData();
}

function Activity_UsesDefaultSatisfactionRollupRules() {
    return this.LearningObject.UsesDefaultSatisfactionRollupRules;
}

function Activity_UsesDefaultCompletionRollupRules() {
    return this.LearningObject.UsesDefaultCompletionRollupRules;
}

function CosmeticPage(_42f, _430, _431) {
    this.FrameName = _42f;
    this.PageHref = _430;
    this.Parameters = _431;
}

function GlobalObjective(_432, ID, _434, _435, _436, _437, _438, _439, _43a, _43b, _43c, _43d, _43e) {
    Debug.AssertError("Global Objective not created with all parameters (is the call missing the index?).", (_437 === null || _437 === undefined));
    this.Index = _432;
    this.ID = ID;
    this.ProgressStatus = _434;
    this.SatisfiedStatus = _435;
    this.MeasureStatus = _436;
    this.NormalizedMeasure = _437;
    this.ScoreRaw = _438;
    this.ScoreMin = _439;
    this.ScoreMax = _43a;
    this.CompletionStatus = _43b;
    this.CompletionStatusValue = _43c;
    this.ProgressMeasureStatus = _43d;
    this.ProgressMeasure = _43e;
    this.DataState = DATA_STATE_CLEAN;
}
GlobalObjective.prototype.GetXml = GlobalObjective_GetXml;
GlobalObjective.prototype.Clone = GlobalObjective_Clone;
GlobalObjective.prototype.SetDirtyData = GlobalObjective_SetDirtyData;
GlobalObjective.prototype.ResetState = GlobalObjective_ResetState;

function GlobalObjective_GetXml(_43f) {
    var _440 = new ServerFormater();
    var xml = new XmlElement("GO");
    xml.AddAttribute("RI", _43f);
    xml.AddAttribute("ROI", this.Index);
    xml.AddAttribute("I", this.ID);
    xml.AddAttribute("PS", _440.ConvertBoolean(this.ProgressStatus));
    xml.AddAttribute("SS", _440.ConvertBoolean(this.SatisfiedStatus));
    xml.AddAttribute("MS", _440.ConvertBoolean(this.MeasureStatus));
    xml.AddAttribute("NM", this.NormalizedMeasure);
    xml.AddAttribute("CS", _440.ConvertBoolean(this.CompletionStatus));
    xml.AddAttribute("CSV", _440.ConvertBoolean(this.CompletionStatusValue));
    if (this.ScoreRaw !== null) {
        xml.AddAttribute("SR", this.ScoreRaw);
    }
    if (this.ScoreMax !== null) {
        xml.AddAttribute("SM", this.ScoreMax);
    }
    if (this.ScoreMin !== null) {
        xml.AddAttribute("SMi", this.ScoreMin);
    }
    xml.AddAttribute("PrMS", _440.ConvertBoolean(this.ProgressMeasureStatus));
    if (this.ProgressMeasure !== null) {
        xml.AddAttribute("PM", this.ProgressMeasure);
    }
    return xml.toString();
}

function GlobalObjective_Clone() {
    var _442 = new GlobalObjective(this.Index, this.ID, this.ProgressStatus, this.SatisfiedStatus, this.MeasureStatus, this.NormalizedMeasure, this.ScoreRaw, this.ScoreMin, this.ScoreMax, this.CompletionStatus, this.CompletionStatusValue, this.ProgressMeasureStatus, this.ProgressMeasure);
    return _442;
}

function GlobalObjective_SetDirtyData() {
    this.DataState = DATA_STATE_DIRTY;
}

function GlobalObjective_ResetState() {
    this.ProgressStatus = false;
    this.SatisfiedStatus = false;
    this.MeasureStatus = false;
    this.NormalizedMeasure = 0;
    this.ScoreRaw = null;
    this.ScoreMin = null;
    this.ScoreMax = null;
    this.CompletionStatus = false;
    this.CompletionStatusValue = false;
    this.ProgressMeasureStatus = false;
    this.ProgressMeasure = null;
    this.SetDirtyData();
}

function LearningObject(_443, Href, _445, _446, _447, _448, _449, _44a, _44b, _44c, _44d, _44e, _44f, _450, _451, _452, _453, _454, _455, _456, _457, _458) {
    this.Title = _443;
    this.Href = Href;
    this.Parameters = _445;
    this.DataFromLms = _446;
    this.MasteryScore = _447;
    this.MaxTimeAllowed = _448;
    this.TimeLimitAction = _449;
    this.Prerequisites = _44a;
    this.Visible = _44b;
    this.CompletedByMeasure = _44c;
    this.CompletionThreshold = _44d;
    this.CompletionProgressWeight = _44e;
    this.PersistState = _44f;
    this.ItemIdentifier = _450;
    this.ResourceIdentifier = _451;
    this.ExternalIdentifier = _452;
    this.DatabaseIdentifier = _453;
    this.ScormType = _454;
    this.SSPBuckets = _455;
    this.SequencingData = _456;
    this.SharedDataMaps = _457;
    this.Children = _458;
    this.UsesDefaultSatisfactionRollupRules = false;
    this.UsesDefaultCompletionRollupRules = false;
}
LearningObject.prototype.GetScaledPassingScore = LearningObject_GetScaledPassingScore;

function LearningObject_GetScaledPassingScore() {
    if (this.SequencingData !== null && this.SequencingData.PrimaryObjective !== null) {
        if (this.SequencingData.PrimaryObjective.SatisfiedByMeasure === true) {
            if (this.SequencingData.PrimaryObjective.MinNormalizedMeasure !== null) {
                return this.SequencingData.PrimaryObjective.MinNormalizedMeasure;
            } else {
                return 1;
            }
        }
    }
    return null;
}

function LearningStandard(_459) {
    this.value = _459;
}
LearningStandard.prototype.isAICC = LearningStandard_isAICC;
LearningStandard.prototype.is12 = LearningStandard_is12;
LearningStandard.prototype.is2004 = LearningStandard_is2004;
LearningStandard.prototype.is20043rdOrGreater = LearningStandard_is20043rdOrGreater;
LearningStandard.prototype.is20044thOrGreater = LearningStandard_is20044thOrGreater;

function LearningStandard_isAICC() {
    if (this.value == STANDARD_AICC) {
        return true;
    }
    return false;
}

function LearningStandard_is12() {
    if (this.value == STANDARD_SCORM_12) {
        return true;
    }
    return false;
}

function LearningStandard_is2004() {
    if (this.value == STANDARD_SCORM_2004_2ND_EDITION || this.value == STANDARD_SCORM_2004_3RD_EDITION || this.value == STANDARD_SCORM_2004_4TH_EDITION) {
        return true;
    }
    return false;
}

function LearningStandard_is20043rdOrGreater() {
    if (this.value == STANDARD_SCORM_2004_3RD_EDITION || this.value == STANDARD_SCORM_2004_4TH_EDITION) {
        return true;
    }
    return false;
}

function LearningStandard_is20044thOrGreater() {
    if (this.value == STANDARD_SCORM_2004_4TH_EDITION) {
        return true;
    }
    return false;
}
LearningStandard.prototype.toString = function() {
    return this.value;
};
var NAVIGATION_REQUEST_START = "START";
var NAVIGATION_REQUEST_RESUME_ALL = "RESUME ALL";
var NAVIGATION_REQUEST_CONTINUE = "CONTINUE";
var NAVIGATION_REQUEST_PREVIOUS = "PREVIOUS";
var NAVIGATION_REQUEST_FORWARD = "FORWARD";
var NAVIGATION_REQUEST_BACKWARD = "BACKWARD";
var NAVIGATION_REQUEST_CHOICE = "CHOICE";
var NAVIGATION_REQUEST_EXIT = "EXIT";
var NAVIGATION_REQUEST_EXIT_ALL = "EXIT ALL";
var NAVIGATION_REQUEST_SUSPEND_ALL = "SUSPEND ALL";
var NAVIGATION_REQUEST_ABANDON = "ABANDON";
var NAVIGATION_REQUEST_ABANDON_ALL = "ABANDON ALL";
var NAVIGATION_REQUEST_NOT_VALID = "INVALID";
var NAVIGATION_REQUEST_JUMP = "JUMP";
var NAVIGATION_REQUEST_DISPLAY_MESSAGE = "DISPLAY MESSAGE";
var NAVIGATION_REQUEST_EXIT_PLAYER = "EXIT PLAYER";

function NavigationRequest(type, _45b, _45c) {
    this.Type = type;
    this.TargetActivity = _45b;
    this.MessageToUser = _45c;
}
NavigationRequest.prototype.toString = function() {
    return "Type=" + this.Type + ", TargetActivity=" + this.TargetActivity + ", MessageToUser=" + this.MessageToUser;
};
NavigationRequest.prototype.toDescriptiveString = function() {
    var ret = "";
    ret += this.Type;
    if (this.TargetActivity !== null) {
        ret += " targeting \"" + this.TargetActivity + "\".";
    }
    return ret;
};

function PackageProperties(_45e, _45f, _460, _461, _462, _463, _464, _465, _466, _467, _468, _469, _46a, _46b, _46c, _46d, _46e, _46f, _470, _471, _472, _473, _474, _475, _476, _477, _478, _479, _47a, _47b, _47c, _47d, _47e, _47f, _480, _481, _482, _483, _484, _485, _486, _487, _488, _489, _48a, _48b, _48c, _48d, _48e, _48f, _490, _491, _492, _493, _494, _495, _496, _497, _498, _499, _49a, _49b, _49c, _49d, _49e, _49f, _4a0, _4a1, _4a2, _4a3, _4a4, _4a5, _4a6, _4a7, _4a8, _4a9, _4aa, _4ab, _4ac, _4ad, _4ae, _4af, _4b0, _4b1, _4b2, _4b3, _4b4, _4b5, _4b6, _4b7) {
    this.ShowFinishButton = _45e;
    this.ShowCloseItem = _45f;
    this.ShowHelp = _460;
    this.ShowProgressBar = _461;
    this.UseMeasureProgressBar = _462;
    this.ShowCourseStructure = _463;
    this.CourseStructureStartsOpen = _464;
    this.ShowNavBar = _465;
    this.ShowTitleBar = _466;
    this.EnableFlowNav = _467;
    this.EnableChoiceNav = _468;
    this.DesiredWidth = _469;
    this.DesiredHeight = _46a;
    this.DesiredFullScreen = _46b;
    this.RequiredWidth = _46c;
    this.RequiredHeight = _46d;
    this.RequiredFullScreen = _46e;
    this.CourseStructureWidth = _46f;
    this.ScoLaunchType = _470;
    this.PlayerLaunchType = _471;
    this.IntermediateScoSatisfiedNormalExitAction = _472;
    this.IntermediateScoSatisfiedSuspendExitAction = _473;
    this.IntermediateScoSatisfiedTimeoutExitAction = _474;
    this.IntermediateScoSatisfiedLogoutExitAction = _475;
    this.IntermediateScoNotSatisfiedNormalExitAction = _476;
    this.IntermediateScoNotSatisfiedSuspendExitAction = _477;
    this.IntermediateScoNotSatisfiedTimeoutExitAction = _478;
    this.IntermediateScoNotSatisfiedLogoutExitAction = _479;
    this.FinalScoCourseSatisfiedNormalExitAction = _47a;
    this.FinalScoCourseSatisfiedSuspendExitAction = _47b;
    this.FinalScoCourseSatisfiedTimeoutExitAction = _47c;
    this.FinalScoCourseSatisfiedLogoutExitAction = _47d;
    this.FinalScoCourseNotSatisfiedNormalExitAction = _47e;
    this.FinalScoCourseNotSatisfiedSuspendExitAction = _47f;
    this.FinalScoCourseNotSatisfiedTimeoutExitAction = _480;
    this.FinalScoCourseNotSatisfiedLogoutExitAction = _481;
    this.PreventRightClick = _482;
    this.PreventWindowResize = _483;
    this.IsAvailableOffline = _484;
    this.StatusDisplay = _485;
    this.ScoreRollupMode = _486;
    this.NumberOfScoringObjects = _487;
    this.StatusRollupMode = _488;
    this.ThresholdScore = _489;
    this.ApplyRollupStatusToSuccess = _48a;
    this.FirstScoIsPretest = _48b;
    this.WrapScoWindowWithApi = _48c;
    this.FinishCausesImmediateCommit = _48d;
    this.DebugControlAudit = _48e;
    this.DebugControlDetailed = _48f;
    this.DebugRteAudit = _490;
    this.DebugRteDetailed = _491;
    this.DebugSequencingAudit = _492;
    this.DebugSequencingDetailed = _493;
    this.DebugSequencingSimple = _494;
    this.DebugLookAheadAudit = _495;
    this.DebugLookAheadDetailed = _496;
    this.DebugIncludeTimestamps = _497;
    this.CaptureHistory = _498;
    this.CaptureHistoryDetailed = _499;
    this.CommMaxFailedSubmissions = _49a;
    this.CommCommitFrequency = _49b;
    this.InvalidMenuItemAction = _49c;
    this.AlwaysFlowToFirstSco = _49d;
    this.LogoutCausesPlayerExit = _49e;
    this.ResetRunTimeDataTiming = _49f;
    this.ValidateInteractionResponses = _4a0;
    this.LookaheadSequencerMode = _4a1;
    this.ScoreOverridesStatus = _4a2;
    this.AllowCompleteStatusChange = _4a3;
    this.ScaleRawScore = _4a4;
    this.RollupEmptySetToUnknown = _4a5;
    this.ReturnToLmsAction = _4a6;
    this.UseQuickLookaheadSequencer = _4a7;
    this.ForceDisableRootChoice = _4a8;
    this.RollupRuntimeAtScoUnload = _4a9;
    this.ForceObjectiveCompletionSetByContent = _4aa;
    this.InvokeRollupAtSuspendAll = _4ab;
    this.CompletionStatOfFailedSuccessStat = _4ac;
    this.SatisfiedCausesCompletion = _4ad;
    this.MakeStudentPrefsGlobalToCourse = _4ae;
    this.LaunchCompletedRegsAsNoCredit = _4af;
    this.IsCompletionTracked = _4b0;
    this.IsSatisfactionTracked = _4b1;
    this.IsScoreTracked = _4b2;
    this.IsIncompleteScoreMeaningful = _4b3;
    this.IsIncompleteSatisfactionMeaningful = _4b4;
    this.SuspendDataMaxLength = _4b5;
    this.TimeLimit = _4b6;
    this.InternetExplorerCompatibilityMode = _4b7;
}

function Package(Id, _4b9, _4ba, _4bb, _4bc, _4bd) {
    this.Id = Id;
    this.ObjectivesGlobalToSystem = _4b9;
    this.LearningStandard = new LearningStandard(_4ba);
    this.Properties = _4bb;
    this.SharedDataGlobalToSystem = _4bc;
    this.LearningObjects = _4bd;
}

function PossibleRequest(_4be, _4bf, _4c0, _4c1, _4c2) {
    this.NavigationRequest = _4be;
    this.TargetActivityItemIdentifier = _4bf;
    this.WillSucceed = _4c0;
    this.Exception = _4c1;
    this.ExceptionText = _4c2;
    this.TargetActivity = null;
    this.SequencingRequest = null;
    this.TerminationSequencingRequest = null;
    this.Hidden = false;
    this.Disabled = false;
    this.PreConditionSkipped = false;
    this.PreConditionStopForwardTraversal = false;
    this.PreConditionStopForwardTraversalViolation = false;
    this.PreConditionDisabled = false;
    this.PreConditionHiddenFromChoice = false;
    this.LimitConditionViolation = false;
    this.IsVisibleViolation = false;
    this.PreventActivationViolation = false;
    this.ControlChoiceViolation = false;
    this.ForwardOnlyViolation = false;
    this.ChoiceExitViolation = false;
    this.ConstrainedChoiceViolation = false;
    this.NoDeliverablieActivityViolation = false;
    this.WillAlwaysSucceed = false;
    this.WillNeverSucceed = false;
}
PossibleRequest.prototype.toString = function() {
    return "Navigation Request = " + this.NavigationRequest + ", TargetActivityItemIdentifier=" + this.TargetActivityItemIdentifier;
};
PossibleRequest.prototype.GetErrorString = function() {
    var ret = this.ExceptionText;
    return ret.trim();
};
PossibleRequest.prototype.GetExceptionReason = function() {
    var ret = this.ExceptionText;
    ret.trim();
    ret += "[" + this.Exception + "], ";
    ret += ", WillAlwaysSucceed = ";
    ret += this.WillAlwaysSucceed.toString();
    ret += ", WillNeverSucceed = ";
    ret += this.WillNeverSucceed.toString();
    ret += ", PreConditionSkipped = ";
    ret += this.PreConditionSkipped.toString();
    ret += ", PreConditionStopForwardTraversal = ";
    ret += this.PreConditionStopForwardTraversal.toString();
    ret += ", PreConditionDisabled = ";
    ret += this.PreConditionDisabled.toString();
    ret += ", PreConditionHiddenFromChoice = ";
    ret += this.PreConditionHiddenFromChoice.toString();
    ret += ", LimitConditionViolation = ";
    ret += this.LimitConditionViolation.toString();
    ret += ", IsVisibleViolation = ";
    ret += this.IsVisibleViolation.toString();
    ret += ", PreventActivationViolation = ";
    ret += this.PreventActivationViolation.toString();
    ret += ", ControlChoiceViolation = ";
    ret += this.ControlChoiceViolation.toString();
    ret += ", ForwardOnlyViolation = ";
    ret += this.ForwardOnlyViolation.toString();
    ret += ", ChoiceExitViolation = ";
    ret += this.ChoiceExitViolation.toString();
    ret += ", ConstrainedChoiceViolation = ";
    ret += this.ConstrainedChoiceViolation.toString();
    return ret;
};
PossibleRequest.prototype.ResetForNewEvaluation = function() {
    this.WillSucceed = true;
    this.Hidden = false;
    this.Disabled = false;
    this.PreConditionSkipped = false;
    this.PreConditionStopForwardTraversal = false;
    this.PreConditionDisabled = false;
    this.PreConditionHiddenFromChoice = false;
    this.LimitConditionViolation = false;
    this.IsVisibleViolation = false;
    this.PreventActivationViolation = false;
    this.ControlChoiceViolation = false;
    this.ForwardOnlyViolation = false;
    this.ChoiceExitViolation = false;
    this.ConstrainedChoiceViolation = false;
};

function Registration(Id, _4c6, _4c7, _4c8, _4c9, _4ca, _4cb, _4cc, _4cd) {
    this.Id = Id;
    this.SuspendedActivity = _4c6;
    this.TrackingEnabled = _4c7;
    this.LessonMode = _4c8;
    this.Package = _4c9;
    this.Activities = _4ca;
    this.GlobalObjectives = _4cb;
    this.SSPBuckets = _4cc;
    this.SharedData = _4cd;
}
Registration.prototype.FindActivityForThisScormObject = Registration_FindActivityForThisScormObject;

function Registration_FindActivityForThisScormObject(_4ce) {
    for (var i = 0; i < this.Activities.length; i++) {
        if (this.Activities[i].ScormObjectDatabaseId == _4ce) {
            return this.Activities[i];
        }
    }
    Debug.AssertError("Registration_FindActivityForThisScormObject could not find the activity for learning object " + _4ce);
    return null;
}

function SequencingData(_4d0, _4d1, _4d2, _4d3, _4d4, _4d5, _4d6, _4d7, _4d8, _4d9, _4da, _4db, _4dc, _4dd, _4de, _4df, _4e0, _4e1, _4e2, _4e3, _4e4, _4e5, _4e6, _4e7, _4e8, _4e9, _4ea, _4eb, _4ec, _4ed, _4ee, _4ef, _4f0, _4f1, _4f2, _4f3, _4f4, _4f5, _4f6, _4f7, _4f8, _4f9, _4fa) {
    this.Identifier = _4d0;
    this.Identifierref = _4d1;
    this.ControlChoice = _4d2;
    this.ControlChoiceExit = _4d3;
    this.ControlFlow = _4d4;
    this.ControlForwardOnly = _4d5;
    this.UseCurrentAttemptObjectiveInformation = _4d6;
    this.UseCurrentAttemptProgressInformation = _4d7;
    this.ConstrainChoice = _4d8;
    this.PreventActivation = _4d9;
    this.PreConditionSequencingRules = _4da;
    this.PostConditionSequencingRules = _4db;
    this.ExitSequencingRules = _4dc;
    this.LimitConditionAttemptControl = _4dd;
    this.LimitConditionAttemptLimit = _4de;
    this.LimitConditionAttemptAbsoluteDurationControl = _4df;
    this.LimitConditionAttemptAbsoluteDurationLimit = _4e0;
    this.RollupRules = _4e1;
    this.RollupObjectiveSatisfied = _4e2;
    this.RollupObjectiveMeasureWeight = _4e3;
    this.RollupProgressCompletion = _4e4;
    this.MeasureSatisfactionIfActive = _4e5;
    this.RequiredForSatisfied = _4e6;
    this.RequiredForNotSatisfied = _4e7;
    this.RequiredForCompleted = _4e8;
    this.RequiredForIncomplete = _4e9;
    this.PrimaryObjective = _4ea;
    this.Objectives = _4eb;
    this.SelectionTiming = _4ec;
    this.SelectionCountStatus = _4ed;
    this.SelectionCount = _4ee;
    this.RandomizationTiming = _4ef;
    this.RandomizeChildren = _4f0;
    this.Tracked = _4f1;
    this.CompletionSetByContent = _4f2;
    this.ObjectiveSetByContent = _4f3;
    this.HidePrevious = _4f4;
    this.HideContinue = _4f5;
    this.HideExit = _4f6;
    this.HideAbandon = _4f7;
    this.HideSuspendAll = _4f8;
    this.HideAbandonAll = _4f9;
    this.HideExitAll = _4fa;
}

function SequencingObjectiveMap(_4fb, _4fc, _4fd, _4fe, _4ff, _500, _501, _502, _503, _504, _505, _506, _507, _508, _509) {
    this.TargetObjectiveId = _4fb;
    this.ReadSatisfiedStatus = _4fc;
    this.ReadNormalizedMeasure = _4fd;
    this.ReadRawScore = _4fe;
    this.ReadMinScore = _4ff;
    this.ReadMaxScore = _500;
    this.ReadCompletionStatus = _501;
    this.ReadProgressMeasure = _502;
    this.WriteSatisfiedStatus = _503;
    this.WriteNormalizedMeasure = _504;
    this.WriteRawScore = _505;
    this.WriteMinScore = _506;
    this.WriteMaxScore = _507;
    this.WriteCompletionStatus = _508;
    this.WriteProgressMeasure = _509;
}
SequencingObjectiveMap.prototype.toString = function() {
    return "TargetObjectiveId=" + this.TargetObjectiveId + ", ReadSatisfiedStatus=" + this.ReadSatisfiedStatus + ", ReadNormalizedMeasure=" + this.ReadNormalizedMeasure + ", ReadRawScore=" + this.ReadRawScore + ", ReadMinScore=" + this.ReadMinScore + ", ReadMaxScore=" + this.ReadMaxScore + ", ReadCompletionStatus=" + this.ReadCompletionStatus + ", ReadProgressMeasure=" + this.ReadProgressMeasure + ", WriteSatisfiedStatus=" + this.WriteSatisfiedStatus + ", WriteNormalizedMeasure=" + this.WriteNormalizedMeasure + ", WriteRawScore=" + this.WriteRawScore + ", WriteMinScore=" + this.WriteMinScore + ", WriteMaxScore=" + this.WriteMaxScore + ", WriteCompletionStatus=" + this.WriteCompletionStatus + ", WriteProgressMeasure=" + this.ReadProgressMeasure;
};

function SequencingObjective(Id, _50b, _50c, Maps) {
    this.Id = Id;
    this.SatisfiedByMeasure = _50b;
    this.MinNormalizedMeasure = _50c;
    this.Maps = Maps;
}
SequencingObjective.prototype.toString = function() {
    var ret = "Id=" + this.Id + ", SatisfiedByMeasure=" + this.SatisfiedByMeasure + ", MinNormalizedMeasure=" + this.MinNormalizedMeasure;
    ret += "Maps:";
    for (var map in this.Maps) {
        ret += "{" + map + "}" + this.Maps[map] + "  ";
    }
    return ret;
};

function SequencingRollupRuleCondition(_510, _511) {
    this.Operator = _510;
    this.Condition = _511;
}
SequencingRollupRuleCondition.prototype.toString = function() {
    var ret = "";
    if (this.Operator == RULE_CONDITION_OPERATOR_NOT) {
        ret += "NOT ";
    }
    ret += this.Condition;
    return ret;
};

function SequencingRollupRule(_513, _514, _515, _516, _517, _518) {
    this.ConditionCombination = _513;
    this.ChildActivitySet = _514;
    this.MinimumCount = _515;
    this.MinimumPercent = _516;
    this.Action = _517;
    this.Conditions = _518;
}
SequencingRollupRule.prototype.toString = function() {
    var ret = "If ";
    if (this.ChildActivitySet == CHILD_ACTIVITY_SET_AT_LEAST_COUNT) {
        ret += "At Least " + this.MinimumCount + " Child Activities Meet ";
    } else {
        if (this.ChildActivitySet == CHILD_ACTIVITY_SET_AT_LEAST_PERCENT) {
            ret += "At Least " + this.MinimumPercent + " Percent of Child Activities Meet ";
        } else {
            if (this.ChildActivitySet == CHILD_ACTIVITY_SET_ALL) {
                ret += "All Child Activities Meet ";
            } else {
                if (this.ChildActivitySet == CHILD_ACTIVITY_SET_ANY) {
                    ret += "Any Child Activity Meets ";
                } else {
                    if (this.ChildActivitySet == CHILD_ACTIVITY_SET_NONE) {
                        ret += "No Child Activity Meets ";
                    }
                }
            }
        }
    }
    if (this.ConditionCombination == RULE_CONDITION_COMBINATION_ANY) {
        ret += " Any Condition ";
    } else {
        ret += " All Conditions ";
    }
    ret += " THEN " + this.Action;
    if (this.Conditions.length > 1) {
        ret += ". Conditions: ";
        for (var _51a in this.Conditions) {
            ret += "{" + _51a + "} " + this.Conditions[_51a] + "; ";
        }
    } else {
        ret += ". Condition: " + this.Conditions[0];
    }
    return ret;
};

function SequencingRuleCondition(_51b, _51c, _51d, _51e) {
    this.Condition = _51b;
    this.ReferencedObjective = _51c;
    this.MeasureThreshold = _51d;
    this.Operator = _51e;
}
SequencingRuleCondition.prototype.toString = function() {
    var ret = "";
    if (this.ReferencedObjective != null && this.ReferencedObjective.length > 0) {
        ret += "Objective " + this.ReferencedObjective + " ";
    } else {
        ret += "Activity ";
    }
    if (this.Operator == RULE_CONDITION_OPERATOR_NOT) {
        ret += "NOT ";
    }
    ret += this.Condition;
    if (this.Condition == SEQUENCING_RULE_CONDITION_OBJECTIVE_MEASURE_GREATER_THAN || this.Condition == SEQUENCING_RULE_CONDITION_OBJECTIVE_MEASURE_LESS_THAN) {
        ret += " " + this.MeasureThreshold;
    }
    return ret;
};

function SequencingRule(_520, _521, _522) {
    this.ConditionCombination = _520;
    this.Action = _521;
    this.RuleConditions = _522;
}
SequencingRule.prototype.toString = function() {
    var ret = "If " + this.ConditionCombination + " condition(s) evaluate to true, then " + this.Action + ".  ";
    if (this.RuleConditions.length > 1) {
        ret += "Conditions: ";
        for (var _524 in this.RuleConditions) {
            ret += "{" + _524 + "} " + this.RuleConditions[_524] + "; ";
        }
    } else {
        ret += "Condition: " + this.RuleConditions[0];
    }
    return ret;
};

function SharedDataMap(_525, _526, _527) {
    this.Id = _525;
    this.ReadSharedData = _526;
    this.WriteSharedData = _527;
}
SharedDataMap.prototype.toString = function() {
    return "Id=" + this.Id + ", ReadSharedData=" + this.ReadSharedData + ", WriteSharedData=" + this.WriteSharedData;
};

function SharedData(_528, _529, Data) {
    this.SharedDataId = _528;
    this.SharedDataValId = _529;
    this.Data = Data;
    this.DataState = DATA_STATE_CLEAN;
}
SharedData.prototype.toString = function() {
    return "SharedDataId=" + this.SharedDataId + ", SharedDataValId=" + this.SharedDataValId + ", Data=" + this.Data;
};
SharedData.prototype.GetXml = SharedData_GetXml;
SharedData.prototype.GetData = SharedData_GetData;
SharedData.prototype.WriteData = SharedData_WriteData;
SharedData.prototype.SetDirtyData = SharedData_SetDirtyData;

function SharedData_GetXml() {
    var _52b = new ServerFormater();
    var xml = new XmlElement("SD");
    xml.AddAttribute("SDVI", this.SharedDataValId);
    xml.AddAttribute("D", _52b.TrimToLength(this.Data, 64000));
    return xml.toString();
}

function SharedData_GetData() {
    return this.Data;
}

function SharedData_WriteData(_52d) {
    this.Data = _52d;
    this.SetDirtyData();
}

function SharedData_SetDirtyData() {
    this.DataState = DATA_STATE_DIRTY;
}

function SSPBucketDefinition(Id, _52f, _530, _531, _532, _533) {
    this.Id = Id;
    this.BucketType = _52f;
    this.Persistence = _530;
    this.SizeMin = _531;
    this.SizeRequested = _532;
    this.Reducible = _533;
}
SSPBucketDefinition.prototype.toString = function() {
    return "Id=" + this.Id + ", BucketType=" + this.BucketType + ", Persistence=" + this.Persistence + ", SizeMin=" + this.SizeMin + ", SizeRequested=" + this.SizeRequested + ", Reducible=" + this.Reducible;
};
var SSP_ALLOCATION_SUCCESS_FAILURE = "failure";
var SSP_ALLOCATION_SUCCESS_MINIMUM = "minimum";
var SSP_ALLOCATION_SUCCESS_REQUESTED = "requested";
var SSP_ALLOCATION_SUCCESS_NOT_ATTEMPTED = "not attempted";
var SSP_PERSISTENCE_LEARNER = "learner";
var SSP_PERSISTENCE_COURSE = "course";
var SSP_PERSISTENCE_SESSION = "session";

function SSPBucket(_534, Id, _536, _537, _538, _539, _53a, _53b, _53c, Data) {
    this.BucketIndex = CleanExternalString(_534);
    this.Id = CleanExternalString(Id);
    this.BucketType = CleanExternalString(_536);
    this.Persistence = CleanExternalString(_537);
    this.SizeMin = parseInt(CleanExternalString(_538), 10);
    this.SizeRequested = parseInt(CleanExternalString(_539), 10);
    this.Reducible = CleanExternalString(_53a).toBoolean();
    this.LocalActivityId = CleanExternalString(_53b);
    this.AllocationSuccess = CleanExternalString(_53c);
    this.Data = CleanExternalString(Data);
    this.DataState = DATA_STATE_CLEAN;
}
SSPBucket.prototype.toString = function() {
    return "BucketIndex=" + this.Index + "Id=" + this.Id + ", BucketType=" + this.BucketType + ", Persistence=" + this.Persistence + ", SizeMin=" + this.SizeMin + ", SizeRequested=" + this.SizeRequested + ", Reducible=" + this.Reducible + ", LocalActivityId=" + this.LocalActivityId + ", AllocationSuccess=" + this.AllocationSuccess + ", Data=" + this.Data;
};
SSPBucket.prototype.GetXml = SSPBucket_GetXml;
SSPBucket.prototype.IsVisible = SSPBucket_IsVisible;
SSPBucket.prototype.CurrentlyUsedStorage = SSPBucket_CurrentlyUsedStorage;
SSPBucket.prototype.GetBucketState = SSPBucket_GetBucketState;
SSPBucket.prototype.GetData = SSPBucket_GetData;
SSPBucket.prototype.WriteData = SSPBucket_WriteData;
SSPBucket.prototype.SetDirtyData = SSPBucket_SetDirtyData;
SSPBucket.prototype.AppendData = SSPBucket_AppendData;
SSPBucket.prototype.SizeAllocated = SSPBucket_SizeAllocated;
SSPBucket.prototype.ResetData = SSPBucket_ResetData;

function SSPBucket_GetXml() {
    var _53e = new ServerFormater();
    var xml = new XmlElement("SSP");
    xml.AddAttribute("IN", this.BucketIndex);
    xml.AddAttribute("ID", _53e.TrimToLength(this.Id, 4000));
    xml.AddAttribute("BT", _53e.TrimToLength(this.BucketType, 4000));
    xml.AddAttribute("P", _53e.ConvertSSPPersistence(this.Persistence));
    xml.AddAttribute("SM", this.SizeMin);
    xml.AddAttribute("SR", this.SizeRequested);
    xml.AddAttribute("R", _53e.ConvertBoolean(this.Reducible));
    xml.AddAttribute("LAI", this.LocalActivityId);
    xml.AddAttribute("AS", _53e.ConvertSSPAllocationSuccess(this.AllocationSuccess));
    xml.AddAttribute("D", this.Data);
    return xml.toString();
}

function SSPBucket_IsVisible(_540) {
    if (this.LocalActivityId == "" || this.LocalActivityId == null || this.LocalActivityId == _540) {
        return true;
    }
    return false;
}

function SSPBucket_CurrentlyUsedStorage() {
    return this.Data.length * 2;
}

function SSPBucket_GetBucketState() {
    var _541 = "";
    var _542 = this.SizeAllocated();
    _541 = "{totalSpace=" + ((_542 != null) ? _542 : 0) + "}";
    _541 += "{used=" + this.CurrentlyUsedStorage() + "}";
    if (this.BucketType != null && this.BucketType.length > 0) {
        _541 += "{type=" + this.BucketType + "}";
    }
    return _541;
}

function SSPBucket_GetData(_543, size) {
    if (_543 == null || _543.length == 0) {
        _543 = 0;
    } else {
        _543 = parseInt(_543, 10);
    }
    if (size == null || size.length == 0) {
        size = 0;
    } else {
        size = parseInt(size, 10);
    }
    _543 = _543 / 2;
    size = size / 2;
    var str = new String();
    if (size > 0) {
        return this.Data.substr(_543, size);
    } else {
        return this.Data.substr(_543);
    }
}

function SSPBucket_WriteData(_546, _547) {
    if (_546 == null || _546.length == 0) {
        _546 = 0;
    } else {
        _546 = parseInt(_546, 10);
    }
    _546 = _546 / 2;
    if (_546 == 0) {
        this.Data = _547;
    } else {
        var _548 = this.Data.slice(0, _546);
        var _549 = "";
        if (_546 + _547.length < this.Data.length) {
            _549 = this.Data.slice(_546 + _547.length);
        }
        this.Data = _548 + _547 + _549;
    }
    this.SetDirtyData();
}

function SSPBucket_AppendData(_54a) {
    this.Data += _54a;
    this.SetDirtyData();
}

function SSPBucket_SetDirtyData() {
    this.DataState = DATA_STATE_DIRTY;
}

function SSPBucket_SizeAllocated() {
    var _54b;
    switch (this.AllocationSuccess) {
        case SSP_ALLOCATION_SUCCESS_FAILURE:
            _54b = null;
            break;
        case SSP_ALLOCATION_SUCCESS_MINIMUM:
            _54b = this.SizeMin;
            break;
        case SSP_ALLOCATION_SUCCESS_REQUESTED:
            _54b = this.SizeRequested;
            break;
        case SSP_ALLOCATION_SUCCESS_NOT_ATTEMPTED:
            _54b = 0;
            break;
        default:
            Debug.AssertError("Invalid allocation success");
            break;
    }
    return _54b;
}

function SSPBucket_ResetData() {
    this.Data = "";
    this.SetDirtyData();
}
dictionary_ll = {
    "delimiter": "`",
    "1158": " (and all its descendents) will be skipped.",
    "1020": " (and all of its descendents) should be disabled. ",
    "1058": " (and all of its descendents) should be hidden. ",
    "597": " (and all of its descendents) will be disabled because its attempt limit has been reached. ",
    "520": " (and all of its descendents) will be hidden because its Prevent Activation attribute is set to true. ",
    "1644": " ; Exception: n/a)",
    "1758": " and ",
    "1100": " and all its descendents to skipped. IsActive=",
    "1440": " and all of its descendents.",
    "1645": " are not siblings.",
    "1724": " are siblings.",
    "717": " because it has a stop forward traversal precondition rule and is a cluster.",
    "754": " because it has a stop forward traversal precondition rule and is a leaf.",
    "900": " because it has a stop forward traversal precondition rule.",
    "1398": " do not have a common ancestor",
    "607": " does not allow choice exit requests. Hiding all activities that are not its descendents.",
    "877": " does not allow flow navigation. Flow navigation is disabled.",
    "843": " does not allow previous navigation. Previous button is disabled.",
    "1327": " does not have suspended children.",
    "1227": " has Sequencing Control Choice = false).",
    "1521": " has suspended children.",
    "1733": " hundredths)",
    "1760": " is ",
    "1245": " is a descendent and will be disabled. ",
    "1283": " is a descendent and will be hidden. ",
    "844": " is a forward sibling so it and its descendents will be disabled.",
    "1545": " is after the activity ",
    "1522": " is before the activity ",
    "1284": " is currently active, stop disabling.",
    "1228": " is not a descendent and will be hidden.",
    "785": " is not a descendent of the previous/next activity and will be hidden.",
    "1353": " is not the last overall activity",
    "1419": " is the last overall activity",
    "1385": " minutes without commiting data",
    "55": " only allows it immediate siblings to be selected (constrained choice). Only activities that are logically next or previous and their descendents (plus the root) are all valid targets for choice, hiding all other activities.",
    "786": " since it does not allow flow navigation. Previous button is disabled.",
    "129": " since it does not allow flow navigation. Stopping here, continue button stays enabled even though request won't succeed. Continue results in user being prompted to select a child item.",
    "787": " since it only allows forward navigation. Previous button is disabled.",
    "1420": " will Stop Forward Traversal.",
    "361": " will be disabled because it is a cluster that does not allow flow navigation and thus its children must be selected explicitly.",
    "797": " will be disabled because its parent does not allow choice requests (",
    "845": " will be hidden because its isVisible attribute is set to false. ",
    "38": " will not succeed. Not initiating SCO unload yet. The EvaluatePossibleNavigationRequests will check to see if the nav request will succeed after re-evaluating all dirty data and if it will succeed, the SCO will be unloaded and it will be invoked.",
    "1484": " would flow to a cluster (",
    "1441": " would flow to an activity (",
    "1708": "' + operand + '",
    "1747": "' From GUI",
    "1485": "' corresponds to activity ",
    "1229": "' does not correspond to valid activity.",
    "1261": "' does not represent a valid activity.",
    "1399": "' represents a valid activity.",
    "1761": "', '",
    "1565": ") (Nothing to deliver)",
    "967": ") (The current activity must have already been exited)",
    "1505": ") (Violates control mode)",
    "1523": ") Violates control mode.",
    "1386": ") and the identified activity (",
    "930": ") and we're starting a new attempt on the root activity (",
    "943": ") and we're starting a new attempt on the root activity.",
    "1387": ") divided by counted measures (",
    "745": ") from the runtime will succeed now after re-evaluating with current data.",
    "1175": ") is Active for the activity is False Then",
    "1694": ") is a leaf Then",
    "955": ") is not a leaf Then - Can only deliver leaf activities",
    "1734": ") is tracked",
    "1566": ") is tracked, tracked=",
    "1021": ") that does not permit flow navigation, disabling.",
    "1022": ") that has a limit condition violation, disabling.",
    "1400": ") that is disabled, disabling.",
    "532": ") to the rollup condition bag (Add the evaluation of this condition the set of evaluated conditions)",
    "285": ") to the rollup condition bag to produce a single combined rule evaluation ('And' or 'Or' set of evaluated conditions, on the rollup definition)",
    "670": "), but Progress Measure is unknown, therefore CompletionStatus is unknown as well",
    "1748": "). Equals ",
    "1262": "**************************************",
    "1614": ", CompletionStatus=",
    "1462": ", Objective Measure Weight=",
    "1725": ", attempted = ",
    "1695": ", commitAttempt=",
    "705": ", had reached its attempt limit and cannot be delivered. Disable next button.",
    "671": ", had reached its attempt limit and cannot be delivered. Disable previous button.",
    "901": ", is disabled and cannot be delivered. Disable next button.",
    "866": ", is disabled and cannot be delivered. Disable previous button.",
    "1751": ", isExit=",
    "1709": ", notSatisfied=",
    "1729": ", returning 0",
    "1726": ", strPostData=",
    "1311": ", this.Api.NeedToCloseOutSession()=",
    "1421": ", this.ExitScormPlayerCalled=",
    "1735": ". Exception=",
    "223": "7.1.1.3.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception ",
    "1546": "; Traversal Direction: ",
    "1312": "API Runtime Nav Request Detected = ",
    "872": "About to save final data upon player exit, final exit calls = ",
    "1739": "Activities ",
    "1176": "Activity Progress Rollup Process [RB.1.3](",
    "909": "Activity Progress Rollup Using Default Process [RB.1.3 a](",
    "910": "Activity Progress Rollup Using Measure Process [RB.1.3 a](",
    "944": "Activity Progress Rollup Using Rules Process [RB.1.3 b](",
    "1130": "Adding new Comment From Learner at position ",
    "990": "Adding new Interaction Correct Response at position ",
    "1113": "Adding new Interaction Objective at position ",
    "1313": "Adding new Interaction at position ",
    "1354": "Adding new Objective at position ",
    "1314": "Adding new interaction at position ",
    "1401": "Adding new objective at index ",
    "1567": "Allowing status change",
    "533": "Bypassing Lookahead Sequencer processing because PackageProperties.LookaheadSequencerMode = disabled",
    "1615": "Call is error free.",
    "968": "Calling Integration Implementation UpdateControl State",
    "1402": "Check Activity Process [UP.5](",
    "1114": "Check Child for Rollup Subprocess [RB.1.4.2](",
    "1547": "CheckForGetValueError (",
    "1548": "CheckForSetValueError (",
    "1506": "Checking for Commit Error",
    "1507": "Checking for Finish Error",
    "1463": "Checking for GetValue Error",
    "1422": "Checking for Initialize Error",
    "1442": "Checking for Terminate Error",
    "1403": "Checking for first SCO pretest",
    "1285": "Checking for valid choice nav request",
    "1177": "Checking for valid choice/jump nav request",
    "1298": "Checking to see if the nav request (",
    "1101": "Choice Activity Traversal Subprocess [SB.2.4](",
    "1328": "Choice Flow Subprocess [SB.2.9.1](",
    "1037": "Choice Flow Tree Traversal Subprocess [SB.2.9.2](",
    "1159": "Choice Sequencing Request Process [SB.2.9](",
    "1115": "Clear Suspended Activity Subprocess [DB.2.1](",
    "1464": "Clearing Suspended Activity",
    "1667": "Cloning sequencer",
    "1668": "Close Out Session",
    "1740": "Closing Sco",
    "1753": "Commit('",
    "1078": "Communications Call Failed, Failed Submissions=",
    "1263": "Communications Save Data, synchronous=",
    "1524": "Communications_CheckComm",
    "1329": "Communications_KillPostDataProcess",
    "1486": "Communications_SaveDataNow",
    "1423": "Communications_SaveDataOnExit",
    "1315": "Communications_StartPostDataProcess",
    "1367": "Communications_StartWatchProcess",
    "1582": "CompletedByMeasure = ",
    "649": "CompletedByMeasure is not enabled, using the completion status recorded by the SCO-",
    "1116": "Completion Measure Rollup Process [RB.1.1 b](",
    "1549": "Completion Threshold = ",
    "998": "Completion Threshold is known (Completion Treshold=",
    "624": "Completion Threshold is not specified, using the completion status recorded by the SCO-",
    "1616": "CompletionStatus = ",
    "1131": "Content Delivery Environment Process [DB.2](",
    "1132": "Continue Sequencing Request Process [SB.2.7]",
    "1286": "Control ClearPendingNavigationRequest",
    "1465": "Control CreateMenuItem for ",
    "1487": "Control DeliverActivity - ",
    "1550": "Control DisplayError - ",
    "1117": "Control Evaluate Possible Navigation Requests",
    "1525": "Control GetExceptionText",
    "1488": "Control GetXmlForDirtyData",
    "1646": "Control Initialize",
    "1526": "Control IsThereDirtyData",
    "1466": "Control MarkDirtyDataPosted",
    "1467": "Control MarkPostedDataClean",
    "1468": "Control MarkPostedDataDirty",
    "1118": "Control Recieved Abandon All Request From GUI",
    "1210": "Control Recieved Abandon Request From GUI",
    "1287": "Control Recieved Choice Request For '",
    "1316": "Control Recieved Close Sco From GUI",
    "1178": "Control Recieved Exit All Request From GUI",
    "1264": "Control Recieved Exit Request From GUI",
    "1265": "Control Recieved Next Request From GUI",
    "1179": "Control Recieved Previous Request From GUI",
    "1246": "Control Recieved Return To Lms From GUI",
    "1211": "Control Recieved Suspend Request From GUI",
    "1469": "Control RenderMenuItem for ",
    "1404": "Control ScoUnloaded called by ",
    "1443": "Control ToggleMenuVisibility",
    "1489": "Control TriggerReturnToLMS",
    "1288": "Control Unload: this.ProcessedUnload=",
    "1568": "Control Update Display",
    "1752": "Credit = ",
    "1470": "Current Activity is defined",
    "1388": "Current Activity is not defined",
    "911": "Current status is not attempted so changing based on score",
    "264": "DB.2]1.1. Exit Content Delivery Environment Process (Exception: DB.2-1) (Delivery request is invalid - The Current Activity has not been terminated)",
    "1647": "Deliver activity: ",
    "1330": "Delivery Request Process [DB.1.1](",
    "1551": "Deliverying Activity - ",
    "1133": "Done Evaluating Possible Navigation Requests",
    "969": "ERROR - Invalid server response received from the LMS.",
    "370": "ERROR - LMS was unable to successfully save state date, see the LMS response for specific error information. Server Response=",
    "562": "ERROR - Server side error occurred when saving state data, HTTP response not 200 (OK). Status: ",
    "1368": "ERROR - invalid rollup condition",
    "1389": "ERROR - invalid success status-",
    "956": "ERROR SE-714.1 on 'ActivityExperiencedDurationReported'",
    "970": "ERROR SE-714.1 on 'ActivityExperiencedDurationTracked'",
    "971": "ERROR SE-714.1 on 'AttemptExperiencedDurationReported'",
    "983": "ERROR SE-714.1 on 'AttemptExperiencedDurationTracked'",
    "1266": "ERROR SE-714.1 on 'SessionTimeTracked'",
    "1299": "ERROR SE-714.1 on 'TotalTrackedTime'",
    "246": "Either activity.HasSeqRulesRelevantToChoice = false or possibleNavRequest.WillNeverSucceed = true.  Setting possibleNavRequest.WillAlwaysSucceed = false.",
    "1617": "Element Not Matched",
    "1599": "Element is: _version",
    "1471": "Element is: adl nav request",
    "1331": "Element is: adl nav request choice",
    "1369": "Element is: adl nav request jump",
    "1180": "Element is: adl nav request valid continue",
    "1181": "Element is: adl nav request valid previous",
    "1405": "Element is: adl.data._children",
    "1472": "Element is: adl.data._count",
    "1552": "Element is: adl.data.id",
    "1508": "Element is: adl.data.n.id",
    "1444": "Element is: adl.data.n.store",
    "1490": "Element is: adl.data.store",
    "1509": "Element is: adl.data.type",
    "1473": "Element is: adl.nav.request",
    "1230": "Element is: adl.nav.request_valid.choice",
    "1182": "Element is: adl.nav.request_valid.continue",
    "1267": "Element is: adl.nav.request_valid.jump",
    "1183": "Element is: adl.nav.request_valid.previous",
    "1669": "Element is: audio",
    "1445": "Element is: audio captioning",
    "1553": "Element is: audio level",
    "1527": "Element is: audion level",
    "1600": "Element is: comments",
    "1231": "Element is: comments from leaner.comment",
    "1184": "Element is: comments from learner.location",
    "1160": "Element is: comments from learner.timestamp",
    "1424": "Element is: comments from lms",
    "1185": "Element is: comments, storing at position ",
    "1161": "Element is: comments_from_learner._children",
    "1232": "Element is: comments_from_learner._count",
    "1212": "Element is: comments_from_learner.comment",
    "1186": "Element is: comments_from_learner.location",
    "1162": "Element is: comments_from_learner.n.comment",
    "1134": "Element is: comments_from_learner.n.location",
    "1119": "Element is: comments_from_learner.n.timestamp",
    "1163": "Element is: comments_from_learner.timestamp",
    "1187": "Element is: comments_from_learner_children",
    "1247": "Element is: comments_from_lms._children",
    "1300": "Element is: comments_from_lms._count",
    "1289": "Element is: comments_from_lms.comment",
    "1268": "Element is: comments_from_lms.location",
    "1248": "Element is: comments_from_lms.n.comment",
    "1233": "Element is: comments_from_lms.n.location",
    "1213": "Element is: comments_from_lms.n.timestamp",
    "1249": "Element is: comments_from_lms.timestamp",
    "1370": "Element is: completion threshold",
    "1425": "Element is: completion_status",
    "1371": "Element is: completion_threshold",
    "1491": "Element is: core._children",
    "1510": "Element is: core._version",
    "1648": "Element is: credit",
    "1511": "Element is: deliver speed",
    "1492": "Element is: delivery speed",
    "1670": "Element is: entry",
    "1696": "Element is: exit",
    "1426": "Element is: interacitons.type",
    "1332": "Element is: interactions._children",
    "1390": "Element is: interactions._count",
    "1023": "Element is: interactions.correct responses.pattern",
    "1038": "Element is: interactions.correct_responses._count",
    "1024": "Element is: interactions.correct_responses.pattern",
    "1059": "Element is: interactions.corret_responses._count",
    "1301": "Element is: interactions.description",
    "1474": "Element is: interactions.id",
    "1372": "Element is: interactions.latency",
    "1214": "Element is: interactions.learner_response",
    "999": "Element is: interactions.n.correct_responses._count",
    "972": "Element is: interactions.n.correct_responses.n.pattern",
    "1269": "Element is: interactions.n.description",
    "1427": "Element is: interactions.n.id",
    "1333": "Element is: interactions.n.latency",
    "1164": "Element is: interactions.n.learner_response",
    "1135": "Element is: interactions.n.objectives._count",
    "1188": "Element is: interactions.n.objectives.n.id",
    "1355": "Element is: interactions.n.result",
    "1302": "Element is: interactions.n.timestamp",
    "1391": "Element is: interactions.n.type",
    "1303": "Element is: interactions.n.weighting",
    "1189": "Element is: interactions.objectives._count",
    "1270": "Element is: interactions.objectives.id",
    "1392": "Element is: interactions.result",
    "1215": "Element is: interactions.student_response",
    "1428": "Element is: interactions.text",
    "1429": "Element is: interactions.time",
    "1334": "Element is: interactions.timestamp",
    "1430": "Element is: interactions.type",
    "1335": "Element is: interactions.weighting",
    "1601": "Element is: language",
    "1554": "Element is: launch data",
    "1555": "Element is: launch_data",
    "1569": "Element is: learner id",
    "1528": "Element is: learner name",
    "1570": "Element is: learner_id",
    "1529": "Element is: learner_name",
    "1234": "Element is: learner_preference._children",
    "1079": "Element is: learner_preference.audio_captioning",
    "1190": "Element is: learner_preference.audio_level",
    "1120": "Element is: learner_preference.delivery_speed",
    "1250": "Element is: learner_preference.language",
    "1475": "Element is: lesson location",
    "1556": "Element is: lesson mode",
    "1512": "Element is: lesson status",
    "1476": "Element is: lesson_location",
    "1513": "Element is: lesson_status",
    "1602": "Element is: location",
    "1514": "Element is: mastery score",
    "1446": "Element is: max time allowed",
    "1447": "Element is: max_time_allowed",
    "1697": "Element is: mode",
    "1191": "Element is: nteractions.n.learner_response",
    "1373": "Element is: objectives._children",
    "1431": "Element is: objectives._count",
    "1235": "Element is: objectives.completion_status",
    "1336": "Element is: objectives.description",
    "1515": "Element is: objectives.id",
    "1192": "Element is: objectives.n.completion_status",
    "1304": "Element is: objectives.n.description",
    "1477": "Element is: objectives.n.id",
    "1216": "Element is: objectives.n.progress_measure",
    "1236": "Element is: objectives.n.score._children",
    "1337": "Element is: objectives.n.score.max",
    "1338": "Element is: objectives.n.score.min",
    "1339": "Element is: objectives.n.score.raw",
    "1290": "Element is: objectives.n.score.scaled",
    "1251": "Element is: objectives.n.success_status",
    "1252": "Element is: objectives.progress_measure",
    "1271": "Element is: objectives.score._children",
    "1374": "Element is: objectives.score.max",
    "1375": "Element is: objectives.score.min",
    "1376": "Element is: objectives.score.raw",
    "1317": "Element is: objectives.score.scaled",
    "1318": "Element is: objectives.score_scaled",
    "1432": "Element is: objectives.status",
    "1291": "Element is: objectives.success_status",
    "1448": "Element is: progress measure",
    "1449": "Element is: progress_measure",
    "1377": "Element is: scaled passing score",
    "1378": "Element is: scaled_passing_score",
    "1478": "Element is: score._children",
    "1583": "Element is: score.max",
    "1584": "Element is: score.min",
    "1585": "Element is: score.raw",
    "1530": "Element is: score.scaled",
    "1531": "Element is: session time",
    "1532": "Element is: session_time",
    "1671": "Element is: speed",
    "1571": "Element is: ssp._count",
    "1533": "Element is: ssp.allocate",
    "1493": "Element is: ssp.appendData",
    "1450": "Element is: ssp.bucket_state",
    "1603": "Element is: ssp.data",
    "1305": "Element is: ssp.n.allocation_success",
    "1451": "Element is: ssp.n.appendData",
    "1479": "Element is: ssp.n.bucket_id",
    "1406": "Element is: ssp.n.bucket_state",
    "1572": "Element is: ssp.n.data",
    "1604": "Element is: ssp.n.id",
    "1573": "Element is: student id",
    "1534": "Element is: student name",
    "1340": "Element is: student_data._children",
    "1237": "Element is: student_preference._children",
    "1494": "Element is: success status",
    "1495": "Element is: success_status",
    "1535": "Element is: suspend data",
    "1536": "Element is: suspend_data",
    "1698": "Element is: text",
    "1433": "Element is: time limit action",
    "1434": "Element is: time_limit_action",
    "1574": "Element is: total time",
    "1575": "Element is: total_time",
    "1618": "Element is: version",
    "1480": "End Attempt Process [UP.4](",
    "991": "Evaluate Possible Navigation Requests Process [EPNR]",
    "1039": "Evaluate Rollup Conditions Subprocess [RB.1.4.1](",
    "1319": "Evaluate Sequencing Rule Condition(",
    "1217": "Exit Sequencing Request Process [SB.2.11]",
    "1379": "Exiting Control Deliver Activity",
    "1407": "Exiting Control Update Display",
    "1136": "Flow Activity Traversal Subprocess [SB.2.2](",
    "1516": "Flow Subprocess [SB.2.3](",
    "1238": "Flow Tree Traversal Subprocess [SB.2.1](",
    "1537": "Found Dirty Data to Save",
    "1481": "Generating Exit Nav Request",
    "1341": "Generating Suspend All Nav Request",
    "1710": "GetDiagnostic('",
    "1699": "GetErrorString('",
    "1727": "GetLastError()",
    "1320": "GetSequencingControlChoice = false.",
    "1749": "GetValue('",
    "1482": "In ScoHasTerminatedSoUnload",
    "1356": "In SendDataToServer, synchronous=",
    "1321": "Initial Selection and Randomization",
    "1736": "Initialize('",
    "1737": "Initialized ",
    "1025": "Initializing Possible Navigation Request Absolutes",
    "1218": "Initializing Possible Navigation Requests",
    "442": "Invoking ScoHasTerminatedSoUnload from Terminate, scheduled for 150 ms. Control.IsThereAPendingNavigationRequest() = ",
    "1219": "Jump Sequencing Request Process [SB.2.13]",
    "1741": "LMSCommit('",
    "1742": "LMSFinish('",
    "1649": "LMSGetDiagnostic('",
    "1619": "LMSGetErrorString('",
    "1672": "LMSGetLastError()",
    "1730": "LMSGetValue('",
    "1711": "LMSInitialize('",
    "1731": "LMSSetValue('",
    "1357": "Launching intermediate page from ",
    "1272": "Limit Conditions Check Process [UP.1](",
    "1452": "Loading Sco In Frameset at: ",
    "1358": "Lookahead Sequencer Mode Disabled",
    "1380": "Lookahead Sequencer Mode Enabled",
    "1712": "MasteryScore = ",
    "1743": "Max Score: ",
    "1381": "Measure Rollup Process [RB.1.1](",
    "1744": "Min Score: ",
    "276": "Missing mastery score or raw score, but skipping auto-completion because compatibility setting ForceObjectiveCompletionSetByContent is set to true",
    "945": "Missing mastery score or raw score, setting to completed",
    "1755": "Mode = ",
    "1408": "Mode is review so don't change",
    "12": "NB.2.1]4.2.1. If the Sequencing Control Flow for the parent of the Current Activity is True And the Sequencing Control Forward Only for the parent of the Current Activity is False Then (Validate that a 'flow' sequencing request can be processed from the current activity)",
    "1040": "Nav request will NOT succeed. Leaving SCO loaded.",
    "1239": "Nav request will succeed. Unloading SCO.",
    "1306": "Navigation Request Process [NB.2.1](",
    "1700": "New Total Time: ",
    "1342": "New Tracked Total Time for Asset: ",
    "1538": "New Tracked Total Time: ",
    "1605": "Next entry is normal",
    "1606": "Next entry is resume",
    "1240": "No API Runtime Nav Request, exit action=",
    "1586": "No Dirty Data to Save",
    "1650": "No interaction at ",
    "1409": "No navigation request, exiting",
    "1273": "Not tracked...not transfering RTE data",
    "1026": "Objective Rollup Using Default Process [RB.1.2 c](",
    "1027": "Objective Rollup Using Measure Process [RB.1.2 a](",
    "1060": "Objective Rollup Using Rules Process [RB.1.2 b](",
    "1359": "Objective RollupProcess [RB.1.2](",
    "957": "Objective element is undefined, returning empty string.",
    "1382": "Overall Rollup Process [RB.1.5](",
    "1360": "Overall Sequencing Process [OP.1]",
    "1028": "OverallSequencingProcess for SCORM 1.1 / SCORM 1.2",
    "723": "Package had non-legacy setting for ReturnToLMS, but does not use SCORM 2004",
    "1165": "Performing sequencing look ahead evaluation",
    "1435": "Pre-evaluation of exit action",
    "1029": "Pretest satisfied, marking all activities complete",
    "1137": "Previous Sequencing Request Process [SB.2.8]",
    "1713": "Previous Time: ",
    "1620": "Progress Measure = ",
    "616": "Progress Measure exceeds Completion Threshold so setting completion status to completed.",
    "569": "Progress Measure is less than Completion Threshold so setting completion status to incomplete.",
    "1557": "RB.1.1]5.1.2. Break For",
    "1343": "Randomize Children Process [SR.2](",
    "1453": "Recorded CompletionStatus = ",
    "1517": "Recorded SuccessStatus = ",
    "1102": "Resume All Sequencing Request Process [SB.2.6]",
    "1576": "RetrieveGetValueData (",
    "1193": "Retry Sequencing Request Process [SB.2.10]",
    "1539": "Rolling up activity data",
    "1274": "Rollup Rule Check Subprocess [RB.1.4](",
    "1307": "Rollup will skip blocked activities.",
    "1673": "Root Activity is ",
    "1361": "RunTimeApi_ImmediateRollup called",
    "1220": "RunTimeApi_IsValidArrayOfLocalizedStrings",
    "1221": "RunTimeApi_IsValidArrayOfShortIdentifiers",
    "1587": "RunTimeApi_IsValidUrn",
    "1496": "RunTimeApi_ValidCharString",
    "1410": "RunTimeApi_ValidFillInResponse",
    "1497": "RunTimeApi_ValidIdentifier",
    "1540": "RunTimeApi_ValidLanguage",
    "1411": "RunTimeApi_ValidLikeRTResponse",
    "1393": "RunTimeApi_ValidLocalizedString",
    "1344": "RunTimeApi_ValidLongFillInResponse",
    "1412": "RunTimeApi_ValidLongIdentifier",
    "1383": "RunTimeApi_ValidMatchingResponse",
    "1275": "RunTimeApi_ValidMultipleChoiceResponse",
    "1394": "RunTimeApi_ValidNumericResponse",
    "1454": "RunTimeApi_ValidOtheresponse",
    "1322": "RunTimeApi_ValidPerformanceResponse",
    "1607": "RunTimeApi_ValidReal",
    "1345": "RunTimeApi_ValidSequencingResponse",
    "1395": "RunTimeApi_ValidShortIdentifier",
    "1608": "RunTimeApi_ValidTime",
    "1455": "RunTimeApi_ValidTimeInterval",
    "1362": "RunTimeApi_ValidTrueFalseResponse",
    "13": "SB.2.9]11.9.1.1. If Activity is Active for the activity is False And (the activity is Not the common ancestor And adlseq:preventActivation for the activity is True) Then (If the activity being considered is not already active, make sure we are allowed to activate it)",
    "14": "SB.2.9]12.9.1.1. If Activity is Active for the activity is False And (the activity is Not the common ancestor And adlseq:preventActivation for the activity is True) Then (If the activity being considered is not already active, make sure we are allowed to activate it)",
    "931": "SCO requested a Suspend All, setting exit type to suspend",
    "1292": "SCORM ERROR FOUND - Set Error State: ",
    "1558": "SSP Call is error free.",
    "570": "Scaled Passing Score is known, but score is unknown, therefore SuccessStaus is unknown as well",
    "641": "Scaled Passing Score is not specified, using the success status recorded by the SCO-",
    "697": "Scaled Score exceeds Scaled Passing Score so setting success status to passed.",
    "650": "Scaled Score is less than Scaled Passing Score so setting success status to failed.",
    "1588": "ScaledPassingScore = ",
    "811": "Sco is completed so resetting credit to no-credit and mode to review",
    "1541": "Sco was taken for credit",
    "1754": "Score = ",
    "1241": "Score exceeds mastery, setting to passed",
    "1194": "Score less than mastery, setting to failed",
    "1396": "Select Children Process [SR.1](",
    "1061": "Sequencing Exit Action Rules Subprocess [TB.2.1]",
    "1000": "Sequencing Post Condition Rules Subprocess [TB.2.2]",
    "1293": "Sequencing Request Process [SB.2.12](",
    "1276": "Sequencing Rules Check Process [UP.2](",
    "1166": "Sequencing Rules Check Subprocess [UP.2.1](",
    "1577": "Server Responded With:",
    "1728": "Session Time: ",
    "1750": "SetValue('",
    "1456": "Setting Current Activity to ",
    "835": "Setting WillNeverSucceed = true on all child activities. (Count = ",
    "1308": "Setting completion status to browsed",
    "1080": "Setting sequencer pointer for cloned activities",
    "224": "Skipping ContentDeliveryEnvironmentActivityDataSubProcess because content is LAUNCH AFTER CLICK.  This method will get called when activity is actually viewed",
    "1457": "Skipping blocked activity : ",
    "1222": "Start Sequencing Request Process [SB.2.5]",
    "755": "Status has been set, checking to override to passed/failed based on score",
    "1458": "StatusSetInCurrentSession = ",
    "1738": "StoreValue (",
    "1745": "Stored as: ",
    "1701": "SuccessStatus = ",
    "1578": "Suspended Activity is ",
    "1436": "Suspended Activity is defined",
    "1363": "Suspended Activity is not defined",
    "604": "Suspended activity is not deliverable, AlwaysFlowToFirstSco is true, flowing to first SCO.",
    "397": "SuspendedActivityDefined[SB.2.6]2. If the Suspended Activity is Not Defined Then (Make sure there is something to resume)",
    "1621": "Suspending Activity",
    "341": "Suspending Activity (no nav request because the package property LogoutCausesPlayerExit precludes logout from causing a suspend all)",
    "475": "TB.2.3]3.3.3. If the Sequencing Post Condition Rule Subprocess returned a termination request of Exit All Then",
    "181": "TB.2.3]3.4. If the Current Activity is the Root of the Activity Tree AND the sequencing request returned by the Sequencing Post Condition Rule Subprocess is not Retry Then",
    "452": "TB.2.3]3.4.1. Exit Termination Request Process (Termination Request: Valid; Sequencing Request: Exit; Exception n/a)",
    "912": "TB.2.3]3.5. Until processed exit is False (processed exit=",
    "1579": "Tearing down sequencer",
    "1121": "Terminate Descendent Attempts Process [UP.3](",
    "1746": "Terminate('",
    "1294": "Termination Request Process [TB.2.3](",
    "836": "The Return To LMS button should be not be available for selection.",
    "1714": "The activities ",
    "1732": "The activity ",
    "1346": "The common ancestor of activities ",
    "1702": "The identifier '",
    "1347": "The runtime navigation request of ",
    "776": "This activity utilized a launchable Asset, so automatically complete it",
    "846": "Time limit exceeded, automatically returning user from the course",
    "1122": "Time limit exceeded, blocking entry to course",
    "1277": "Transferring RTE data to Activity data",
    "417": "UP.1]10. Exit Limit Conditions Check Process (Limit Condition Violated: False) (No limit conditions have been violated)",
    "1001": "UnLoading Sco and launching intermediate page from ",
    "1323": "Updating display for each menu item",
    "913": "User requested a Suspend All, setting exit type to suspend",
    "1041": "WARNING - Unable to normalize score - Raw Score: ",
    "1703": "WARNING: GL-100 ",
    "878": "WARNING: GL-200 30 minutes passed without persisting any data",
    "349": "WARNING: The value 'logout' has been deprecated by ADL and should no longer be used. This value may lead to unpredictable behavior.",
    "1609": "WillAlwaysSucceed = ",
    "1622": "WillNeverSucceed = ",
    "873": "[DB.1.1]1. If the activity specified by the delivery request (",
    "581": "[DB.1.1]1.1. Exit Delivery Request Process (Delivery Request: Not Valid; Exception: DB.1.1-1)",
    "207": "[DB.1.1]2. Form the activity path as the ordered series of activities from the root of the activity tree to the activity specified in the delivery request, inclusive",
    "837": "[DB.1.1]3. If the activity path is Empty Then - Nothing to deliver",
    "582": "[DB.1.1]3.1. Exit Delivery Request Process (Delivery Request: Not Valid; Exception: DB.1.1-2)",
    "528": "[DB.1.1]4. For each activity in the activity path - Make sure each activity along the path is allowed",
    "858": "[DB.1.1]4.1. Apply the Check Activity Process to the activity - ",
    "902": "[DB.1.1]4.2. If the Check Activity Process return True Then",
    "563": "[DB.1.1]4.2.1. Exit Delivery Request Process (Delivery Request: Not Valid; Exception: DB.1.1-3)",
    "659": "[DB.1.1]5. Exit Delivery Request Process (Delivery Request: Valid; Exception: n/a)",
    "605": "[DB.2.1]1. If the Suspended Activity is Defined Then Make sure there is something to clear",
    "598": "[DB.2.1]1.1. Find the common ancestor of the identified activity and the Suspended Activity",
    "342": "[DB.2.1]1.2. Form an activity path as the ordered series of activities from the Suspended Activity to the common ancestor, inclusive",
    "1002": "[DB.2.1]1.3. If the activity path is Not Empty Then",
    "334": "[DB.2.1]1.3.1. For each activity in the activity path (Walk down the tree setting each of the identified activities to not suspended)",
    "1081": "[DB.2.1]1.3.1.1. If the activity is a leaf Then",
    "788": "[DB.2.1]1.3.1.1.1. Set Activity is Suspended for the activity to False",
    "1589": "[DB.2.1]1.3.1.2. Else",
    "398": "[DB.2.1]1.3.1.2.1. If the activity does not include any child activity whose Activity is Suspended attribute is True Then",
    "767": "[DB.2.1]1.3.1.2.1.1. Set Activity is Suspended for the activity to False",
    "608": "[DB.2.1]1.4. Set Suspended Activity to Undefined (Clear the Suspended Activity attribute)",
    "1003": "[DB.2.1]2. Exit Clear Suspended Activity Subprocess",
    "200": "[DB.2]1.If the Activity is Active for the Current Activity is True Then (If the attempt on the current activity has not been terminated, we cannot deliver new content)",
    "208": "[DB.2]2. If the activity identified for delivery is not equal to the Suspended Activity Then (Content is about to be delivered, clear any existing suspend all state)",
    "554": "[DB.2]2.1. Apply the Clear Suspended Activity Subprocess to the activity identified for delivery",
    "230": "[DB.2]3. Apply the Terminate Descendent Attempts Process to the activity identified for delivery (Make sure that all attempts that should end are terminated)",
    "66": "[DB.2]4.Form the activity path as the ordered series of activities from the root of the activity tree to the activity identified for delivery, inclusive (Begin all attempts required to deliver the identified activity)",
    "1082": "[DB.2]5. For each activity in the activity path",
    "1542": "[DB.2]5.1. If Activity (",
    "984": "[DB.2]5.1.1. If Tracked for the activity is True Then",
    "114": "[DB.2]5.1.1.1. If Activity is Suspended for the activity is True Then (If the previous attempt on the activity ended due to a suspension, clear the suspended state; do not start a new attempt)",
    "812": "[DB.2]5.1.1.1.1. Set Activity is Suspended for the activity to False",
    "1623": "[DB.2]5.1.1.2. Else",
    "485": "[DB.2]5.1.1.2.1. Increment the Activity Attempt Count for the activity (Begin a new attempt on the activity)",
    "357": "[DB.2]5.1.1.2.2. If Activity Attempt Count for the activity is equal to One (1) Then (Is this the first attempt on the activity?)",
    "768": "[DB.2]5.1.1.2.2.1. Set Activity Progress Status for the activity to True",
    "161": "[DB.2]5.1.1.2.3. Initialize Objective Progress Information and Attempt Progress Information required for the new attempt. Initialize tracking information for the new attempt.",
    "798": "[DB.2]5.1.1.2.4. If objectives global to system is false (obj global=",
    "544": "[DB.2]5.1.1.2.4.1. Reset any global objectives and initialize the activity tree for a new attempt.",
    "698": "[DB.2]5.1.1.2.5. If shared data global to system is false (shared data global=",
    "672": "[DB.2]5.1.1.2.5.1. Reset any shared data associated with this attempt on content.",
    "890": "[DB.2]5.1.2. Set Activity is Active for the activity to True",
    "231": "[DB.2]6. The activity identified for delivery becomes the current activity Set Current Activity to the activity identified for delivery. Identified Activity=",
    "1138": "[DB.2]7. Set Suspended Activity to undefined",
    "821": "[DB.2]8. Exit Content Delivery Environment Process (Exception: n/a)",
    "822": "[DB.2]9. Exit Content Delivery Environment Process (Exception: n/a)",
    "1757": "[EPNR]",
    "1756": "[EPNR] ",
    "789": "[EPNR] 1. Run the navigation request process for each possible request",
    "756": "[EPNR] 1.1. If the navigation request fails, set its WillSucceed to false",
    "724": "[EPNR] 1.2. If the navigation request succeeds, set its WillSucceed to true",
    "215": "[EPNR] 2. If the current activity is active (we are going to need to terminate it for internally navigating sequencing requests (continue, previous, choice, exit)",
    "958": "[EPNR] 2.1 Run the Termination Request Process for Exit",
    "514": "[EPNR] 2.2 There's a rare situation where the suspend all termination request can fail, so check for it",
    "914": "[EPNR] 2.2 if the termination request process return false",
    "859": "[EPNR] 2.2.1 Run the Termination Request Process For Suspend All",
    "718": "[EPNR] 2.2.1 Set the possible navigations that result in sequencing to false",
    "293": "[EPNR] 2.3 If there's an exit all request, the termination request process performs sequencing actions that are relevant later on, so do those.",
    "660": "[EPNR] 2.5. For each possible navigation request that hasn't already been excluded",
    "867": "[EPNR] 2.5.1. Check for disabled and limit condition violations",
    "746": "[EPNR] 2.5.1.1. Activity is disabled, mark it and its children as disabled",
    "678": "[EPNR] 3. For each possible navigation request that hasn't already been excluded",
    "625": "[EPNR] 3.1 If there is a sequencing request returned by the termination request process",
    "418": "[EPNR] 3.1.1 Run the sequencing request process for that sequencing request returned by the termination request process",
    "1042": "[EPNR] 3.1.2 Make sure the activity is not hidden",
    "1651": "[EPNR] 3.1.2. Else",
    "719": "[EPNR] 3.1.3. Run the sequencing request process for that navigation request",
    "838": "[EPNR] 3.2. If the Sequencing Request Process returns an exception",
    "1295": "[EPNR] 3.2.1 Set WillSucceed to false",
    "1123": "[EPNR] 3.2.2 Run the Delivery Request Process",
    "706": "[EPNR] 3.2.2 Set will succed to the results of the delivery request process (",
    "362": "[EPNR] 4. Set any requests that are invalid due to Control Choice, Prevent Activation or Constrained Choice violations to hidden",
    "1498": "[EPNR] 4.1 Hiding request ",
    "430": "[EPNR] 5.1 Overriding continue status based on 3rd Edition GUI requirements, parent's flow = true, continue is enabled",
    "405": "[EPNR] 5.2 Overriding continue status based on 3rd Edition GUI requirements, parent's flow = false, continue is disabled",
    "1195": "[EPNR] A precondition rule indicates that ",
    "1413": "[EPNR] A precondition rule on ",
    "1296": "[EPNR] Cannot flow backwards through ",
    "1483": "[EPNR] Cannot flow through ",
    "390": "[EPNR] Check each activity for sequencing rules that are independent of context (i.e. independent of the current activity)",
    "813": "[EPNR] Check rules that rely on the context of the current activity.",
    "992": "[EPNR] Clearing out possible navigation request data",
    "839": "[EPNR] Current activity is undefined, flow navigation is disabled.",
    "725": "[EPNR] Current activity is undefined, not checking context dependent rules.",
    "1715": "[EPNR] Disable ",
    "1348": "[EPNR] Disable the descendents of ",
    "1253": "[EPNR] Disable the forward siblings of ",
    "26": "[EPNR] Encountered a cluster that must be entered forward only. This traversal is beyond the capabilities of the 'quick' look ahead sequencer. If this navigation request results in an error message, then this course requires the full look ahead sequencer.",
    "790": "[EPNR] Evaluate all precondition rules that could affect the activity.",
    "521": "[EPNR] Run the Termination Request Process To Move Current Runtime Data to Sequencer and Invoke Rollup",
    "1674": "[EPNR] Selecting ",
    "1716": "[EPNR] Setting ",
    "1397": "[EPNR] The current activity is ",
    "302": "[EPNR] The current activity's parent only allows Forward Traversal. Disable all of the parent's children that are before the active activity.",
    "1278": "[EPNR] The logically next activity is ",
    "1324": "[EPNR] The logically next activity,",
    "1196": "[EPNR] The logically previous activity is ",
    "1254": "[EPNR] The logically previous activity,",
    "486": "[EPNR] There is either no previous activity or all previous activities are skipped, disable previous button.",
    "1167": "[EPNR] There is no logically next activity.",
    "1083": "[EPNR] There is no logically previous activity.",
    "1030": "[EPNR] Using the 'Quick' Lookahead Sequencing Mode",
    "463": "[NB.2.1]1.1. If the Current Activity is Not Defined Then (Make sure the sequencing session has not already begun)",
    "209": "[NB.2.1]1.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: n/a; Sequencing Request: Start; Target Activity: n/a; Exception: n/a)",
    "1675": "[NB.2.1]1.2. Else",
    "176": "[NB.2.1]1.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-1)",
    "1168": "[NB.2.1]1.Case: navigation request is Start",
    "1084": "[NB.2.1]10. Case: navigation request is Abandon",
    "506": "[NB.2.1]10.1. If the Current Activity is Defined Then (Make sure the sequencing session has already begun)",
    "286": "[NB.2.1]10.1.1. If the Activity is Active for the Current Activity is True Then (Make sure the current activity has not already been terminated)",
    "182": "[NB.2.1]10.1.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Abandon; Sequencing Request: Exit; Target Activity: n/a; Exception: n/a)",
    "1610": "[NB.2.1]10.1.2. Else",
    "153": "[NB.2.1]10.1.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-12)",
    "1624": "[NB.2.1]10.2. Else ",
    "166": "[NB.2.1]10.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-2)",
    "1004": "[NB.2.1]11. Case: navigation request is Abandon All",
    "277": "[NB.2.1]11.1. If the Current Activity is Defined Then (If the sequencing session has already begun, unconditionally abandon all active activities)",
    "167": "[NB.2.1]11.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Abandon All; Sequencing Request: Exit; Target Activity: n/a; Exception: n/a)",
    "1652": "[NB.2.1]11.2. Else",
    "162": "[NB.2.1]11.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-2) ",
    "1005": "[NB.2.1]12. Case: navigation request is Suspend All",
    "538": "[NB.2.1]12.1. If the Current Activity is Defined Then (If the sequencing session has already begun)",
    "168": "[NB.2.1]12.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Suspend All; Sequencing Request: Exit; Target Activity: n/a; Exception: n/a)",
    "1653": "[NB.2.1]12.2. Else",
    "169": "[NB.2.1]12.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-2)",
    "1139": "[NB.2.1]13. Case: navigation request is Jump",
    "94": "[NB.2.1]13. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-13) (Undefined navigation request)",
    "21": "[NB.2.1]13.1. If the activity specified by the Jump navigation request exists within the activity tree And Available Children for the parent of the activity contains the activity Then (Make sure the target activity exists in the activity tree and is available)",
    "68": "[NB.2.1]13.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Exit; Sequencing Request: Jump; Target Activity: the activity specified by the Jump navigation request; Exception: n/a)",
    "79": "[NB.2.1]13.1.2. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-11) (Target activity does not exist.)",
    "1654": "[NB.2.1]13.2. Else",
    "80": "[NB.2.1]13.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-11) (Target activity does not exist.)",
    "95": "[NB.2.1]14. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-13) (Undefined navigation request)",
    "1043": "[NB.2.1]2. Case: navigation request is Resume All",
    "464": "[NB.2.1]2.1. If the Current Activity is Not Defined Then (Make sure the sequencing session has not already begun)",
    "335": "[NB.2.1]2.1.1. If the Suspended Activity is Defined Then (Make sure the previous sequencing session ended with a suspend all request)",
    "170": "[NB.2.1]2.1.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: n/a; Sequencing Request: Resume All; Target Activity: n/a; Exception: n/a) ",
    "1611": "[NB.2.1]2.1.2. Else ",
    "163": "[NB.2.1]2.1.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-3)",
    "1676": "[NB.2.1]2.2. Else",
    "177": "[NB.2.1]2.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-1)",
    "1085": "[NB.2.1]3. Case: navigation request is Continue",
    "480": "[NB.2.1]3.1. If the Current Activity is Not Defined Then (Make sure the sequencing session has already begun)",
    "178": "[NB.2.1]3.1.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-2)",
    "40": "[NB.2.1]3.2. If the Current Activity is not the root of the activity tree And the Sequencing Control Flow for the parent of the Current Activity is True Then (Validate that a 'flow' sequencing request can be processed from the current activity)",
    "212": "[NB.2.1]3.2.1. If the Activity is Active for the Current Activity is True Then (If the current activity has not been terminated, terminate the current the activity)",
    "183": "[NB.2.1]3.2.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Exit; Sequencing Request: Continue; Target Activity: n/a; Exception: n/a)",
    "1625": "[NB.2.1]3.2.2. Else",
    "186": "[NB.2.1]3.2.2.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: n/a; Sequencing Request: Continue; Target Activity: n/a; Exception: n/a)",
    "1677": "[NB.2.1]3.3. Else",
    "34": "[NB.2.1]3.3.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-4) (Flow is not enabled or the current activity is the root of the activity tree)",
    "1086": "[NB.2.1]4. Case: navigation request is Previous",
    "481": "[NB.2.1]4.1. If the Current Activity is Not Defined Then (Make sure the sequencing session has already begun)",
    "184": "[NB.2.1]4.1.1.Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-2)",
    "239": "[NB.2.1]4.2. If the Current Activity is not the root of the activity tree Then (There is no activity logically 'previous' to the root of the activity tree)",
    "202": "[NB.2.1]4.2.1.1. If the Activity is Active for the Current Activity is True Then (If the current activity has not been terminated, terminate the current the activity)",
    "171": "[NB.2.1]4.2.1.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Exit; Sequencing Request: Previous; Target Activity: n/a; Exception: n/a)",
    "1590": "[NB.2.1]4.2.1.2. Else",
    "179": "[NB.2.1]4.2.1.2.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: n/a; Sequencing Request: Previous; Target Activity: n/a; Exception: n/a)",
    "1626": "[NB.2.1]4.2.2. Else",
    "100": "[NB.2.1]4.2.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-5) (Violates control mode)",
    "1678": "[NB.2.1]4.3. Else",
    "50": "[NB.2.1]4.3.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-6) (Cannot move backward from the root of the activity tree)",
    "799": "[NB.2.1]5. Case: navigation request is Forward (Behavior not defined)",
    "187": "[NB.2.1]5.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-7)",
    "791": "[NB.2.1]6. Case: navigation request is Backward (Behavior not defined)",
    "188": "[NB.2.1]6.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-7)",
    "1103": "[NB.2.1]7. Case: navigation request is Choice ",
    "195": "[NB.2.1]7.1. If the activity specified by the Choice navigation request exists within the activity tree Then (Make sure the target activity exists in the activity tree)",
    "2": "[NB.2.1]7.1.1. If the activity specified by the Choice navigation request is the root of the activity tree Or the Sequencing Control Choice for the parent of the activity specified by the Choice navigation request is True Then (Validate that a 'choice' sequencing request can be processed on the target activity)",
    "443": "[NB.2.1]7.1.1.1. If the Current Activity is Not Defined Then (Attempt to start the sequencing session through choice)",
    "59": "[NB.2.1]7.1.1.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: n/a; Sequencing Request: Choice; Target Activity: the activity specified by the Choice navigation request; Exception: n/a)",
    "399": "[NB.2.1]7.1.1.2. If the activity specified by the Choice navigation request is Not a sibling of the Current Activity Then",
    "124": "[NB.2.1]7.1.1.2. If the activity specified by the Choice navigation request is Not a sibling of the Current Activity Then (We are always allowed to choose a sibling of the current activity)",
    "365": "[NB.2.1]7.1.1.2.1. Find the common ancestor of the Current Activity and the activity specified by the Choice navigation request",
    "1": "[NB.2.1]7.1.1.2.2. Form the activity path as the ordered series of activities from the Current Activity to the common ancestor (The common ancestor will not terminate as a result of processing the choice sequencing request, unless the common ancestor is the Current Activity - the current activity should always be included in the activity path)",
    "932": "[NB.2.1]7.1.1.2.3. If the activity path is Not Empty Then",
    "96": "[NB.2.1]7.1.1.2.3.1. For each activity in the activity path (Make sure that 'choosing' the target will not force an active activity to terminate, if that activity does not allow choice to terminate it)",
    "216": "[NB.2.1]7.1.1.2.3.1.1. If Activity is Active for the activity is True And the Sequencing Control Choice Exit for the activity is False Then (Activity Identifier-",
    "172": "[NB.2.1]7.1.1.2.3.1.1.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: ",
    "86": "[NB.2.1]7.1.1.2.3.1.1.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-8) (Violates control mode)",
    "1559": "[NB.2.1]7.1.1.2.4. Else",
    "145": "[NB.2.1]7.1.1.2.4.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-9)",
    "46": "[NB.2.1]7.1.1.3. If Activity is Active for the Current Activity is True And the Sequencing Control Choice Exit for the Current Activity is False Then (The Choice target is a sibling to the Current Activity, check if the Current Activity)",
    "203": "[NB.2.1]7.1.1.3. If the Activity is Active for the Current Activity is True Then (If the current activity has not been terminated, terminate the current the activity)",
    "56": "[NB.2.1]7.1.1.3.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Exit; Sequencing Request: Choice; Target Activity: the activity specified by the Choice navigation request; Exception: n/a) ",
    "1591": "[NB.2.1]7.1.1.4. Else",
    "204": "[NB.2.1]7.1.1.4. If the Activity is Active for the Current Activity is True Then (If the current activity has not been terminated, terminate the current the activity)",
    "57": "[NB.2.1]7.1.1.4.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Exit; Sequencing Request: Choice; Target Activity: the activity specified by the Choice navigation request; Exception: n/a) ",
    "60": "[NB.2.1]7.1.1.4.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: n/a; Sequencing Request: Choice; Target Activity: the activity specified by the Choice navigation request; Exception: n/a)",
    "1592": "[NB.2.1]7.1.1.5. Else",
    "61": "[NB.2.1]7.1.1.5.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: n/a; Sequencing Request: Choice; Target Activity: the activity specified by the Choice navigation request; Exception: n/a)",
    "1627": "[NB.2.1]7.1.2. Else",
    "99": "[NB.2.1]7.1.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Termination Request: n/a; Sequencing Request: n/a; Target Activity: n/a; Exception: NB.2.1-10) (Violates control mode)",
    "1679": "[NB.2.1]7.2. Else",
    "87": "[NB.2.1]7.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-11) (Target activity does not exist)",
    "1169": "[NB.2.1]8. Case: navigation request is Exit",
    "507": "[NB.2.1]8.1. If the Current Activity is Defined Then (Make sure the sequencing session has already begun)",
    "193": "[NB.2.1]8.1.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Exit; Sequencing Request: Exit; Target Activity: n/a) ; Exception: n/a)",
    "1628": "[NB.2.1]8.1.2. Else",
    "75": "[NB.2.1]8.1.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-12) (Activity has already terminated )",
    "1680": "[NB.2.1]8.2. Else",
    "173": "[NB.2.1]8.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-2) ",
    "1087": "[NB.2.1]9. Case: navigation request is Exit All",
    "269": "[NB.2.1]9.1. If the Current Activity is Defined Then (If the sequencing session has already begun, unconditionally terminate all active activities)",
    "194": "[NB.2.1]9.1.1. Exit Navigation Request Process (Navigation Request: Valid; Termination Request: Exit All; Sequencing Request: Exit; Target Activity: n/a; Exception: n/a)",
    "1681": "[NB.2.1]9.2. Else",
    "180": "[NB.2.1]9.2.1. Exit Navigation Request Process (Navigation Request: Not Valid; Sequencing Request: n/a; Termination Request: n/a; Target Activity: n/a; Exception: NB.2.1-2)",
    "1414": "[OP.1]1. Navigation Request = ",
    "757": "[OP.1]1.1. Apply the Navigation Request Process to the navigation request",
    "626": "[OP.1]1.2. If the Navigation Request Process returned navigation request Not Valid Then",
    "726": "[OP.1]1.2.1. Handle the navigation request exception Behavior not specified",
    "847": "[OP.1]1.2.2. Continue Loop - wait for the next navigation request",
    "368": "[OP.1]1.3. If there is a termination request Then (If the current activity is active, end the attempt on the current activity)",
    "707": "[OP.1]1.3.1. Apply the Termination Request Process to the termination request",
    "599": "[OP.1]1.3.2. If the Termination Request Process returned termination request Not Valid Then",
    "699": "[OP.1]1.3.2.1. Handle the termination request exception Behavior not specified",
    "823": "[OP.1]1.3.2.2. Continue Loop - wait for the next navigation request",
    "700": "[OP.1]1.3.3. If Termination Request Process returned a sequencing request Then",
    "39": "[OP.1]1.3.3.1. Replace any pending sequencing request by the sequencing request returned by the Termination Request Process (There can only be one pending sequencing request. Use the one returned by the termination request process, if it exists)",
    "1062": "[OP.1]1.4. If there is a sequencing request Then",
    "727": "[OP.1]1.4.1. Apply the Sequencing Request Process to the sequencing request",
    "609": "[OP.1]1.4.2. If the Sequencing Request Process returned sequencing request Not Valid Then",
    "708": "[OP.1]1.4.2.1. Handle the sequencing request exception Behavior not specified",
    "824": "[OP.1]1.4.2.2. Continue Loop - wait for the next navigation request",
    "534": "[OP.1]1.4.3. If the Sequencing Request Process returned a request to end the sequencing session Then",
    "76": "[OP.1]1.4.3.1. Exit Overall Sequencing Process - the sequencing session has terminated; return control to LTS (Exiting from the root of the activity tree ends the sequencing session; return control to the LTS)",
    "583": "[OP.1]1.4.4. If the Sequencing Request Process did not identify an activity for delivery Then",
    "825": "[OP.1]1.4.4.1. Continue Loop - wait for the next navigation request",
    "571": "[OP.1]1.4.5. Delivery request is for the activity identified by the Sequencing Request Process",
    "1104": "[OP.1]1.5. If there is a delivery request Then",
    "777": "[OP.1]1.5.1. Apply the Delivery Request Process to the delivery request",
    "630": "[OP.1]1.5.2. If the Delivery Request Process returned delivery request Not Valid Then",
    "728": "[OP.1]1.5.2.1. Handle the delivery request exception Behavior not specified",
    "826": "[OP.1]1.5.2.2. Continue Loop - wait for the next navigation request",
    "651": "[OP.1]1.5.3. Apply the Content Delivery Environment Process to the delivery request",
    "946": "[OP.1]2. End Loop - wait for the next navigation request",
    "769": "[OP.1]x. Navigation request is display message, exit sequencing process.",
    "690": "[OP.1]x. Navigation request is display message, translating to an exit request.",
    "814": "[OP.1]x. Navigation request is exit player, exit sequencing process.",
    "1044": "[OP.1]x. No API Runtime Nav Request, exit action=",
    "933": "[RB.1.1 b]1. Set the total weighted measure to Zero (0.0)",
    "1309": "[RB.1.1 b]2. Set valid data to False",
    "1006": "[RB.1.1 b]3. Set the counted measures to Zero (0.0)",
    "1170": "[RB.1.1 b]4. For each child of the activity",
    "631": "[RB.1.1 b]4.1. If Tracked for the child is True Then (Only include tracked children.)",
    "259": "[RB.1.1 b]4.1.1. Increment counted measures by the adlcp:progressWeight for the child (The child is included, account for it in the weighted average)",
    "800": "[RB.1.1 b]4.1.2. If the Attempt Completion Amount Status is True Then",
    "90": "[RB.1.1 b]4.1.2.1. Add the product of Attempt Completion Amount multiplied by the adlcp:progressWeight to the total weighted measure (Only include progress that has been reported or previously rolled-up)",
    "1223": "[RB.1.1 b]4.1.2.2. Set valid data to True",
    "1242": "[RB.1.1 b]5. If valid data is False Then",
    "320": "[RB.1.1 b]5.1. Set the Attempt Completion Amount Status to False (No progress state rolled-up, cannot determine the rolled-up progress.)",
    "1629": "[RB.1.1 b]5.2. Else",
    "522": "[RB.1.1 b]5.2.1. If counted measures is greater than (>) Zero (0.0) Then (Set the rolled-up progress.)",
    "827": "[RB.1.1 b]5.2.1.1. Set the Attempt Completion Amount Status to True",
    "476": "[RB.1.1 b]5.2.1.2. Set the Attempt Completion Amount to the total weighted measure divided by counted measures",
    "1580": "[RB.1.1 b]5.2.2. Else ",
    "366": "[RB.1.1 b]5.2.2.1. Set the Attempt Completion Amount Status for the target objective to False (No children contributed weight.)",
    "1007": "[RB.1.1 b]6. Exit Completion Measure Rollup Process",
    "959": "[RB.1.1]1. Set the total weighted measure to Zero (0.0)",
    "1349": "[RB.1.1]2. Set valid date to False",
    "1045": "[RB.1.1]3. Set the counted measures to Zero (0.0)",
    "1063": "[RB.1.1]4. Set the target objective to Undefined",
    "915": "[RB.1.1]5. For each objective associated with the activity",
    "627": "[RB.1.1]5. Get the primary objective (For each objective associated with the activity)",
    "343": "[RB.1.1]5.1. If Objective Contributes to Rollup for the objective is True Then (Find the target objective for the rolled-up measure)",
    "947": "[RB.1.1]5.1.1. Set the target objective to the objective",
    "1105": "[RB.1.1]6. If target objective is Defined Then",
    "1171": "[RB.1.1]6.1. For each child of the activity",
    "555": "[RB.1.1]6.1.1. If Tracked for the child is True Then (Only include tracked children). Tracked = ",
    "985": "[RB.1.1]6.1.1.1. Set rolled-up objective to Undefined",
    "879": "[RB.1.1]6.1.1.2. For each objective associated with the child",
    "1172": "[RB.1.1]6.1.1.2. Get the primary objective.",
    "642": "[RB.1.1]6.1.1.2.1. If Objective Contributes to Rollup for the objective is True Then",
    "880": "[RB.1.1]6.1.1.2.1.1. Set rolled-up objective to the objective",
    "1415": "[RB.1.1]6.1.1.2.1.2. Break For",
    "960": "[RB.1.1]6.1.1.3. If rolled-up objective is Defined Then",
    "545": "[RB.1.1]6.1.1.3.1. Increment counted measures by the Rollup Objective Measure Weight for the child",
    "600": "[RB.1.1]6.1.1.3.2. If the Objective Measure Status for the rolled-up objective is True Then",
    "121": "[RB.1.1]6.1.1.3.2.1. Add the product of Objective Normalized Measure for the rolled-up objective multiplied by the Rollup Objective Measure Weight for the child to the total weighted measure",
    "828": "[RB.1.1]6.1.1.3.2.2. Set valid data to True - Normalized Measure = ",
    "1593": "[RB.1.1]6.1.1.4. Else",
    "495": "[RB.1.1]6.1.1.4.1. Exit Measure Rollup Process (One of the children does not include a rolled-up objective)",
    "1243": "[RB.1.1]6.2. If valid data is False Then",
    "103": "[RB.1.1]6.2.1. Set the Objective Measure Status for the target objective to False (No tracking state rolled-up, cannot determine the rolled-up measure. Total of all objectivemeasureweight values = ",
    "1682": "[RB.1.1]6.3. Else",
    "385": "[RB.1.1]6.3.1 If counted measures is greater than (>) Zero (0.0) Then (Set the rolled-up measure for the target objective.)",
    "679": "[RB.1.1]6.3.1. Set the Objective Measure Status for the target objective to True",
    "673": "[RB.1.1]6.3.1.1 Set the Objective Measure Status for the target objective to True",
    "477": "[RB.1.1]6.3.1.2. Set the Objective Normalized Measure for the target objective to the total weighted measure (",
    "1630": "[RB.1.1]6.3.2. Else",
    "487": "[RB.1.1]6.3.2. Set the Objective Normalized Measure for the target objective to the total weighted measure (",
    "453": "[RB.1.1]6.3.2.1 Set the Objective Measure Status for the target objective to False (No children contributed weight.)",
    "1197": "[RB.1.1]6.3.3. Exit Measure Rollup Process",
    "539": "[RB.1.1]7.Exit Measure Rollup Process No objective contributes to rollup, so we cannot set anything",
    "1031": "[RB.1.2 a]1. Set the target objective to Undefined",
    "891": "[RB.1.2 a]2. For each objective associated with the activity",
    "617": "[RB.1.2 a]2. Get the primary objective (For each objective associated with the activity)",
    "146": "[RB.1.2 a]2.1. If Objective Contributes to Rollup for the objective is True Then (Identify the objective that may be altered based on the activity's children's rolled up measure)",
    "916": "[RB.1.2 a]2.1.1. Set the target objective to the objective",
    "1499": "[RB.1.2 a]2.1.2. Break For",
    "1064": "[RB.1.2 a]3. If target objective is Defined Then",
    "127": "[RB.1.2 a]3.1. If Objective Satisfied by Measure for the target objective is True Then (If the objective is satisfied by measure, test the rolled-up measure against the defined threshold)",
    "303": "[RB.1.2 a]3.1.1. If the Objective Measure Status for the target objective is False Then (No Measure known, so objective status is unreliable)",
    "628": "[RB.1.2 a]3.1.1.1. Set the Objective Progress Status for the target objective to False",
    "1594": "[RB.1.2 a]3.1.2. Else",
    "130": "[RB.1.2 a]3.1.2.1. If Activity is Active for the activity is False Or (Activity is Active for the activity is True And adlseq:measureSatisfactionIfActive for the activity is True ) Then",
    "105": "[RB.1.2 a]3.1.2.1.1. If the Objective Normalized Measure for the target objective is greater than or equal (>=) to the Objective Minimum Satisfied Normalized Measure for the target objective Then",
    "610": "[RB.1.2 a]3.1.2.1.1.1. Set the Objective Progress Status for the target objective to True",
    "606": "[RB.1.2 a]3.1.2.1.1.2. Set the Objective Satisfied Status for the target objective to True",
    "1518": "[RB.1.2 a]3.1.2.1.2. Else",
    "611": "[RB.1.2 a]3.1.2.1.2.1. Set the Objective Progress Status for the target objective to True",
    "601": "[RB.1.2 a]3.1.2.1.2.2. Set the Objective Satisfied Status for the target objective to False",
    "1560": "[RB.1.2 a]3.1.2.2. Else",
    "270": "[RB.1.2 a]3.1.2.2.1. Set the Objective Progress Status for the target objective to False (Incomplete information, do not evaluate objective status)",
    "917": "[RB.1.2 a]3.2. Exit Objective Rollup Using Measure Process",
    "1683": "[RB.1.2 a]4. Else",
    "482": "[RB.1.2 a]4.1. Exit Objective Roll up Process (No objective contributes to rollup, so we cannot set anything)",
    "391": "[RB.1.2 a]4.1. Exit Objective Rollup Using Measure Process (No objective contributes to rollup, so we cannot set anything)",
    "23": "[RB.1.2 b]1. If the activity does not include Rollup Rules with the Not Satisfied  rollup action And the activity does not include Rollup Rules with the Satisfied  rollup action Then (If no objective rollup rules are defined, use the default rollup rules.)  ",
    "110": "[RB.1.2 b]1.1. Apply a Rollup Rule to the activity with a Rollup Child Activity Set of All; a Rollup Condition of Satisfied; and a Rollup Action of Satisfied (Define the default satisfied rule )",
    "69": "[RB.1.2 b]1.2. Apply a Rollup Rule to the activity with a Rollup Child Activity Set of All; a Rollup Condition of Objective Status Known; and a Rollup Action of Not Satisfied (Define the default not satisfied rule )",
    "1046": "[RB.1.2 b]1.Set the target objective to Undefined",
    "892": "[RB.1.2 b]2. For each objective associated with the activity",
    "618": "[RB.1.2 b]2. Get the primary objective (For each objective associated with the activity)",
    "148": "[RB.1.2 b]2.1. If Objective Contributes to Rollup for the objective is True Then (Identify the objective that may be altered based on the activity's children's rolled up status)",
    "918": "[RB.1.2 b]2.1.1. Set the target objective to the objective",
    "1500": "[RB.1.2 b]2.1.2. Break For",
    "1047": "[RB.1.2 b]2.Set the target objective to Undefined",
    "893": "[RB.1.2 b]3. For each objective associated with the activity",
    "619": "[RB.1.2 b]3. Get the primary objective (For each objective associated with the activity)",
    "1065": "[RB.1.2 b]3. If target objective is Defined Then",
    "294": "[RB.1.2 b]3.1. Apply the Rollup Rule Check Subprocess to the activity and the Not Satisfied rollup action Process all Not Satisfied rules first",
    "149": "[RB.1.2 b]3.1. If Objective Contributes to Rollup for the objective is True Then (Identify the objective that may be altered based on the activity's children's rolled up status)",
    "919": "[RB.1.2 b]3.1.1. Set the target objective to the objective",
    "1501": "[RB.1.2 b]3.1.2. Break For",
    "801": "[RB.1.2 b]3.2. If the Rollup Rule Check Subprocess returned True Then",
    "652": "[RB.1.2 b]3.2.1. Set the Objective Progress Status for the target objective to True",
    "632": "[RB.1.2 b]3.2.2. Set the Objective Satisfied Status for the target objective to False",
    "327": "[RB.1.2 b]3.3. Apply the Rollup Rule Check Subprocess to the activity and the Satisfied rollup action Process all Satisfied rules last",
    "802": "[RB.1.2 b]3.4. If the Rollup Rule Check Subprocess returned True Then",
    "653": "[RB.1.2 b]3.4.1. Set the Objective Progress Status for the target objective to True",
    "643": "[RB.1.2 b]3.4.2. Set the Objective Satisfied Status for the target objective to True",
    "948": "[RB.1.2 b]3.5. Exit Objective Rollup Using Rules Process",
    "1684": "[RB.1.2 b]4. Else",
    "1066": "[RB.1.2 b]4. If target objective is Defined Then",
    "295": "[RB.1.2 b]4.1. Apply the Rollup Rule Check Subprocess to the activity and the Not Satisfied rollup action Process all Not Satisfied rules first",
    "431": "[RB.1.2 b]4.1. Exit Objective Rollup Using Rules Process No objective contributes to rollup, so we cannot set anything",
    "803": "[RB.1.2 b]4.2. If the Rollup Rule Check Subprocess returned True Then",
    "654": "[RB.1.2 b]4.2.1. Set the Objective Progress Status for the target objective to True",
    "633": "[RB.1.2 b]4.2.2. Set the Objective Satisfied Status for the target objective to False",
    "328": "[RB.1.2 b]4.3. Apply the Rollup Rule Check Subprocess to the activity and the Satisfied rollup action Process all Satisfied rules last",
    "804": "[RB.1.2 b]4.4. If the Rollup Rule Check Subprocess returned True Then",
    "655": "[RB.1.2 b]4.4.1. Set the Objective Progress Status for the target objective to True",
    "644": "[RB.1.2 b]4.4.2. Set the Objective Satisfied Status for the target objective to True",
    "949": "[RB.1.2 b]4.5. Exit Objective Rollup Using Rules Process",
    "1685": "[RB.1.2 b]5. Else",
    "432": "[RB.1.2 b]5.1. Exit Objective Rollup Using Rules Process No objective contributes to rollup, so we cannot set anything",
    "1561": "[RB.1.2 c] satisfied = ",
    "1244": "[RB.1.2 c]0.5. If the activity is a leaf",
    "1255": "[RB.1.2 c]0.5.1 Exit, nothing to rollup",
    "1032": "[RB.1.2 c]1. Set the target objective to Undefined",
    "894": "[RB.1.2 c]2. For each objective associated with the activity",
    "620": "[RB.1.2 c]2. Get the primary objective (For each objective associated with the activity)",
    "147": "[RB.1.2 c]2.1. If Objective Contributes to Rollup for the objective is True Then (Identify the objective that may be altered based on the activity's children's rolled up measure)",
    "920": "[RB.1.2 c]2.1.1. Set the target objective to the objective",
    "1502": "[RB.1.2 c]2.1.2. Break For",
    "1088": "[RB.1.2 c]3. Get the set of applicable children",
    "1048": "[RB.1.2 c]4. initialize all not satisfied to true",
    "1124": "[RB.1.2 c]5. initialize all satisfied to true",
    "1279": "[RB.1.2 c]6. for each applicable child",
    "1364": "[RB.1.2 c]6.1 if child activity (",
    "1089": "[RB.1.2 c]6.1 satisfied = activity.getsatisfied",
    "1049": "[RB.1.2 c]6.1.1 satisfied = activity.getsatisfied",
    "1050": "[RB.1.2 c]6.1.2 attempted = activity.getattempted",
    "729": "[RB.1.2 c]6.1.3 not satisfied = (satisfied === false || attempted === true)",
    "895": "[RB.1.2 c]6.1.4 all statisfied = all satisfied AND satisfied",
    "778": "[RB.1.2 c]6.1.5 all not satisfied = all not satisfied AND not satisfied",
    "1090": "[RB.1.2 c]6.2 attempted = activity.getattempted",
    "758": "[RB.1.2 c]6.3 not satisfied = (satisfied === false || attempted === true)",
    "921": "[RB.1.2 c]6.4 all statisfied = all satisfied AND satisfied",
    "805": "[RB.1.2 c]6.5 all not satisfied = all not satisfied AND not satisfied",
    "1008": "[RB.1.2 c]7. If All Not Satified. (allNotSatisfied=",
    "674": "[RB.1.2 c]7.1. Set the Objective Progress Status for the target objective to True",
    "656": "[RB.1.2 c]7.2. Set the Objective Satisfied Status for the target objective to False",
    "1091": "[RB.1.2 c]7.3. If All Satisfied. (allSatisfied=",
    "657": "[RB.1.2 c]7.3.1. Set the Objective Progress Status for the target objective to True",
    "645": "[RB.1.2 c]7.3.2. Set the Objective Satisfied Status for the target objective to True",
    "1256": "[RB.1.2 c]Retrieving Status for child #",
    "1067": "[RB.1.2]1. Set the target objective to Undefined",
    "922": "[RB.1.2]2. For each objective associated with the activity",
    "629": "[RB.1.2]2. Get the primary objective (For each objective associated with the activity)",
    "154": "[RB.1.2]2.1. If Objective Contributes to Rollup for the objective is True Then (Identify the objective that may be altered based on the activity's children's rolled up measure)",
    "950": "[RB.1.2]2.1.1. Set the target objective to the objective",
    "1543": "[RB.1.2]2.1.2. Break For",
    "691": "[RB.1.2]3.1. If Objective Satisfied By Measure for the target objective is True",
    "868": "[RB.1.2]3.1.1 Invoke the Objective Rollup Process Using Measure",
    "1140": "[RB.1.2]3.1.2 Exit Objective Roll up Process",
    "1686": "[RB.1.2]3.2 Else ",
    "590": "[RB.1.2]3.2 If the Activity has rollup rules that have the action Satisfied or Not Satisfied",
    "496": "[RB.1.2]3.2.1 Apply Objective Rollup Using Rules Process (The default is included in the Rules process now)",
    "881": "[RB.1.2]3.2.1 Invoke the Objective Rollup Process Using Rules",
    "1141": "[RB.1.2]3.2.2 Exit Objective Roll up Process",
    "1198": "[RB.1.2]3.3 Exit Objective Roll up Process",
    "386": "[RB.1.2]3.3 Invoke the Objective Rollup Process Using Default - Neither Sub Process is Applicable, so use the Default Rules",
    "1199": "[RB.1.2]3.4 Exit Objective Roll up Process",
    "1092": "[RB.1.3 a]1. If activity is not tracked, return",
    "1280": "[RB.1.3 a]1. If the activity is a leaf",
    "1297": "[RB.1.3 a]1.1 Exit, nothing to rollup",
    "1093": "[RB.1.3 a]2. Get the set of applicable children",
    "1051": "[RB.1.3 a]2. Set Attempt Progress Status to False",
    "993": "[RB.1.3 a]3.  Set Attempt Completion Status to False",
    "1106": "[RB.1.3 a]3. initialize all incomplete to true",
    "134": "[RB.1.3 a]4. If adlcp:completedbyMeasure for the target objective is True Then (If the completion is determined by measure, test the rolled-up progress against the defined threshold.)",
    "1224": "[RB.1.3 a]4. initialize completed to true",
    "371": "[RB.1.3 a]4.1. If the Attempt Completion Amount Status is False Then (No progress amount known, so the status is unreliable.)",
    "903": "[RB.1.3 a]4.1.1. Set the Attempt Completion Status to False",
    "1631": "[RB.1.3 a]4.2. Else",
    "444": "[RB.1.3 a]4.2.1. If the Attempt Completion Amount is greater than or equal (>=) to the adlcp:minProgressMeasure  Then",
    "934": "[RB.1.3 a]4.2.1.1. Set the Attempt Progress Status True  ",
    "874": "[RB.1.3 a]4.2.1.2. Set the Attempt Completion Status to True  ",
    "1581": "[RB.1.3 a]4.2.2. Else ",
    "961": "[RB.1.3 a]4.2.2.1. Set the Attempt Progress Status True",
    "882": "[RB.1.3 a]4.2.2.2. Set the Attempt Completion Status to False",
    "1687": "[RB.1.3 a]5. Else",
    "1281": "[RB.1.3 a]5. for each applicable child",
    "1365": "[RB.1.3 a]5.1 if child activity (",
    "461": "[RB.1.3 a]5.1. Set the Attempt Progress Status False (Incomplete information, do not evaluate completion status.) ",
    "1052": "[RB.1.3 a]5.1.1 completed = activity.getcompleted",
    "1053": "[RB.1.3 a]5.1.2 attempted = activity.getattempted",
    "770": "[RB.1.3 a]5.1.3 incomplete = (completed === false || attempted === true)",
    "883": "[RB.1.3 a]5.1.4. Child should be included in completed rollup",
    "884": "[RB.1.3 a]5.1.4.1 all completed = all completed AND completed",
    "875": "[RB.1.3 a]5.1.5. Child should be included in incomplete rollup",
    "848": "[RB.1.3 a]5.1.5.1. all incomplete = all incomplete AND incomplete",
    "860": "[RB.1.3 a]6. Exit Activity Progress Rollup Using Measure Process",
    "1416": "[RB.1.3 a]6. If All Incomplete",
    "779": "[RB.1.3 a]6.1. Set the Attempt Progress Status for the activity to True",
    "747": "[RB.1.3 a]6.2. Set the Attempt Completion Status for the activity to False",
    "1437": "[RB.1.3 a]7. If All Satisfied",
    "780": "[RB.1.3 a]7.1. Set the Attempt Progress Status for the activity to True",
    "759": "[RB.1.3 a]7.2. Set the Attempt Completion Status for the activity to True",
    "31": "[RB.1.3 b]1. If the activity does not include Rollup Rules with the Incomplete rollup action And the activity does not include Rollup Rules with the Completed  rollup action Then (If no progress rollup rules are defined, use the default rollup rules.) ",
    "111": "[RB.1.3 b]1.1. Apply a Rollup Rule to the activity with a Rollup Child Activity Set of All; a Rollup Condition of Completed; and a Rollup Action of Completed (Define the default completed rule)",
    "70": "[RB.1.3 b]1.2. Apply a Rollup Rule to the activity with a Rollup Child Activity Set of All; a Rollup Condition of Activity Progress Known; and a Rollup Action of Incomplete (Define the default not incomplete rule)",
    "314": "[RB.1.3 b]2. Apply the Rollup Rule Check Subprocess to the activity and the Incomplete rollup action (Process all Incomplete rules first.)",
    "806": "[RB.1.3 b]3. If the Rollup Rule Check Subprocess returned True Then  ",
    "760": "[RB.1.3 b]3.1. Set the Attempt Progress Status for the activity to True  ",
    "720": "[RB.1.3 b]3.2. Set the Attempt Completion Status for the activity to False  ",
    "321": "[RB.1.3 b]4. Apply the Rollup Rule Check Subprocess to the activity and the Completed rollup action (Process all Completed rules last.) ",
    "829": "[RB.1.3 b]5. If the Rollup Rule Check Subprocess returned True Then",
    "761": "[RB.1.3 b]5.1. Set the Attempt Progress Status for the activity to True  ",
    "730": "[RB.1.3 b]5.2. Set the Attempt Completion Status for the activity to True  ",
    "1033": "[RB.1.3 b]6. Exit Activity Progress Rollup Process",
    "336": "[RB.1.3]1. Apply the Rollup Rule Check Subprocess to the activity and the Incomplete rollup action Process all Incomplete rules first",
    "91": "[RB.1.3]1. Using Measure:  If the activity has Completed by Measure equal to True, then the rolled-up progress measure is compared against the Minimum Progress Measure and Measure Satisfaction if Active:",
    "849": "[RB.1.3]1.1 Apply Activity Progress Rollup Using Measure Process ",
    "1717": "[RB.1.3]2. Else",
    "850": "[RB.1.3]2. If the Rollup Rule Check Subprocess returned True Then",
    "851": "[RB.1.3]2.1. Apply Activity Progress Rollup Using Measure Process",
    "807": "[RB.1.3]2.1. Set the Attempt Progress Status for the activity to True",
    "771": "[RB.1.3]2.2. Set the Attempt Completion Status for the activity to False",
    "350": "[RB.1.3]3. Apply the Rollup Rule Check Subprocess to the activity and the Completed rollup action Process all Completed rules last.",
    "1068": "[RB.1.3]3. Exit Activity Progress Rollup Process",
    "852": "[RB.1.3]4. If the Rollup Rule Check Subprocess returned True Then",
    "808": "[RB.1.3]4.1. Set the Attempt Progress Status for the activity to True",
    "781": "[RB.1.3]4.2. Set the Attempt Completion Status for the activity to True",
    "1173": "[RB.1.3]4.5. Rolling up using Default Rules",
    "1069": "[RB.1.3]5. Exit Activity Progress Rollup Process",
    "387": "[RB.1.4.1]1.Initialize rollup condition bag as an Empty collection (This is used track of the evaluation rule's conditions)",
    "792": "[RB.1.4.1]2. For each Rollup Condition in the set of Rollup Conditions",
    "36": "[RB.1.4.1]2.1. Evaluate the rollup condition by applying the appropriate tracking information for the activity to the Rollup Condition. (Evaluate each condition against the activity's tracking information. This evaluation may result in 'unknown'.)",
    "369": "[RB.1.4.1]2.2. If the Rollup Condition Operator for the Rollup Condition is Not Then (Negating 'unknown' results in 'unknown')",
    "1142": "[RB.1.4.1]2.2.1. Negate the rollup condition",
    "973": "[RB.1.4.1]2.3. Add the value of the rollup condition (",
    "308": "[RB.1.4.1]3. If the rollup condition bag is Empty Then (If there are no defined conditions for the rule, cannot determine the rule applies)",
    "692": "[RB.1.4.1]3.1. Exit Evaluate Rollup Conditions Subprocess (Evaluation: Unknown)",
    "1107": "[RB.1.4.1]4. Apply the Condition Combination (",
    "497": "[RB.1.4.1]5. Exit Evaluate Rollup Conditions Subprocess (Evaluation: the value of combined rule evaluation)",
    "1384": "[RB.1.4.2] Set included to False",
    "1350": "[RB.1.4.2]1. Set included to False",
    "815": "[RB.1.4.2]2. If the Rollup Action is Satisfied Or Not Satisfied Then",
    "406": "[RB.1.4.2]2.1. If the Rollup Objective Satisfied value for the activity is True Then (Test the objective rollup control)",
    "591": "[RB.1.4.2]2.1.1. Set included to True (Default Behavior \ufffd adlseq:requiredFor[xxx] == always)",
    "97": "[RB.1.4.2]2.1.2. If (the Rollup Action is Satisfied And adlseq:requiredForSatisfied is ifNotSuspended) Or (the Rollup Action is Not Satisfied And adlseq:requiredForNotSatisfied is ifNotSuspended) Then",
    "92": "[RB.1.4.2]2.1.2.1. If  Activity Progress Status for the activity is False Or (Activity Attempt Count for the activity is greater than (>) Zero (0) And Activity is Suspended for the activity is True) Then",
    "278": "[RB.1.4.2]2.1.2.1. If Activity Attempt Count for the activity is greater than (>) Zero (0) And Activity is Suspended for the activity is True Then",
    "1200": "[RB.1.4.2]2.1.2.1.1. Set included to False",
    "1595": "[RB.1.4.2]2.1.3. Else",
    "104": "[RB.1.4.2]2.1.3.1. If (the Rollup Action is Satisfied And adlseq:requiredForSatisfied is ifAttempted) Or (the Rollup Action is Not Satisfied And adlseq:requiredForNotSatisfied is ifAttempted) Then",
    "680": "[RB.1.4.2]2.1.3.1.1. If Activity Attempt Count for the activity is Zero (0) Then",
    "329": "[RB.1.4.2]2.1.3.1.1. If Activity Progress Status for the activity is False Or Activity Attempt Count for the activity is Zero (0) Then",
    "1143": "[RB.1.4.2]2.1.3.1.1.1. Set included to False",
    "1562": "[RB.1.4.2]2.1.3.2. Else",
    "98": "[RB.1.4.2]2.1.3.2.1. If (the Rollup Action is Satisfied And adlseq:requiredForSatisfied is ifNotSkipped) Or (the Rollup Action is Not Satisfied And adlseq:requiredForNotSatisfied is ifNotSkipped) Then",
    "467": "[RB.1.4.2]2.1.3.2.1.1. Apply the Sequencing Rules Check Process to the activity and its Skipped sequencing rules",
    "634": "[RB.1.4.2]2.1.3.2.1.2. If the Sequencing Rules Check Process does not return Nil Then",
    "1108": "[RB.1.4.2]2.1.3.2.1.2.1. Set included to False",
    "853": "[RB.1.4.2]3. If the Rollup Action is Completed Or Incomplete Then",
    "419": "[RB.1.4.2]3.1. If the Rollup Progress Completion value for the activity is True Then (Test the progress rollup control)",
    "592": "[RB.1.4.2]3.1.1. Set included to True (Default Behavior \ufffd adlseq:requiredFor[xxx] == always)",
    "106": "[RB.1.4.2]3.1.2. If (the Rollup Action is Completed And adlseq:requiredForCompleted is ifNotSuspended) Or (the Rollup Action is Incomplete And adlseq:requiredForIncomplete is ifNotSuspended) Then",
    "279": "[RB.1.4.2]3.1.2.1. If Activity Attempt Count for the activity is greater than (>) Zero (0) And Activity is Suspended for the activity is True Then",
    "93": "[RB.1.4.2]3.1.2.1. If Activity Progress Status for the activity is False Or (Activity Attempt Count for the activity is greater than (>) Zero (0) And Activity is Suspended for the activity is True) Then",
    "1596": "[RB.1.4.2]3.1.3. Else",
    "117": "[RB.1.4.2]3.1.3.1. If (the Rollup Action is Completed And adlseq:requiredForCompleted is ifAttempted) Or (the Rollup Action is Incomplete And adlseq:requiredForIncomplete is ifAttempted) Then",
    "681": "[RB.1.4.2]3.1.3.1.1. If Activity Attempt Count for the activity is Zero (0) Then",
    "330": "[RB.1.4.2]3.1.3.1.1. If Activity Progress Status for the activity is False Or Activity Attempt Count for the activity is Zero (0) Then",
    "1144": "[RB.1.4.2]3.1.3.1.1.1. Set included to False",
    "1563": "[RB.1.4.2]3.1.3.2. Else",
    "107": "[RB.1.4.2]3.1.3.2.1. If (the Rollup Action is Completed And adlseq:requiredForCompleted is ifNotSkipped) Or (the Rollup Action is Incomplete And adlseq:requiredForIncomplete is ifNotSkipped) Then",
    "468": "[RB.1.4.2]3.1.3.2.1.1. Apply the Sequencing Rules Check Process to the activity and its Skipped sequencing rules",
    "635": "[RB.1.4.2]3.1.3.2.1.2. If the Sequencing Rules Check Process does not return Nil Then",
    "1109": "[RB.1.4.2]3.1.3.2.1.2.1. Set included to False",
    "602": "[RB.1.4.2]4. Exit Check Child for Rollup Subprocess (Child is Included in Rollup: included)",
    "260": "[RB.1.4] 1.2.10.1.Exit RollupRule Check Subprocess (Evaluation: True) (Stop at the first rule that evaluates to true - perform the associated action)",
    "265": "[RB.1.4] 1.2.9.1.Exit RollupRule Check Subprocess (Evaluation: True) (Stop at the first rule that evaluates to true - perform the associated action)",
    "331": "[RB.1.4]1. If the activity includes Rollup Rules with the specified Rollup Action Then  (Make sure the activity has rules to evaluate)",
    "214": "[RB.1.4]1.1. Initialize rules list by selecting the set of Rollup Rules for the activity that have the specified Rollup Actions, maintaining original rule ordering",
    "1145": "[RB.1.4]1.2. For each rule in the rules list",
    "1366": "[RB.1.4]1.2.0. Rule Description: ",
    "748": "[RB.1.4]1.2.1. Initialize contributing children bag as an empty collection",
    "1125": "[RB.1.4]1.2.10. If status change is True Then",
    "1126": "[RB.1.4]1.2.2. For each child of the activity",
    "974": "[RB.1.4]1.2.2.1. If Tracked for the child is True Then",
    "236": "[RB.1.4]1.2.2.2.1. Apply Check Child for Rollup Subprocess to the child and the Rollup Action (Make sure this child contributes to the status of its parent)",
    "749": "[RB.1.4]1.2.2.2.2. If Check Child for Rollup Subprocess returned True Then",
    "156": "[RB.1.4]1.2.2.2.2.1. Apply the Evaluate Rollup Conditions Subprocess to the child and the Rollup Conditions for the rule (Evaluate the rollup conditions on the child activity)",
    "309": "[RB.1.4]1.2.2.2.2.2. If Evaluate Rollup Conditions Subprocess returned Unknown Then (Account for a possible 'unknown' condition evaluation)",
    "721": "[RB.1.4]1.2.2.2.2.2.1. Add an Unknown value to the contributing children bag",
    "1519": "[RB.1.4]1.2.2.2.2.3. Else",
    "682": "[RB.1.4]1.2.2.2.2.4. If Evaluate Rollup Conditions Subprocess returned True Then",
    "772": "[RB.1.4]1.2.2.2.2.4.1. Add a True value to the contributing children bag",
    "1520": "[RB.1.4]1.2.2.2.2.5. Else",
    "762": "[RB.1.4]1.2.2.2.2.5.1. Add a False value to the contributing children bag",
    "189": "[RB.1.4]1.2.3. Initialize status change to False (Determine if the appropriate children contributed to rollup; if they did, the status of the activity should be changed.)",
    "935": "[RB.1.4]1.2.4. Case: the Rollup Child Activity Set is All",
    "904": "[RB.1.4]1.2.4. Case: the contributing children bag is empty",
    "550": "[RB.1.4]1.2.4.1. Break  (No action; do not change status unless some child contributed to rollup)",
    "540": "[RB.1.4]1.2.4.1. If the contributing children bag does not contain a value of False Or Unknown Then",
    "1146": "[RB.1.4]1.2.4.1.1. Set status change to True",
    "936": "[RB.1.4]1.2.5. Case: the Rollup Child Activity Set is All",
    "937": "[RB.1.4]1.2.5. Case: the Rollup Child Activity Set is Any",
    "693": "[RB.1.4]1.2.5.1. If the contributing children bag contains a value of True Then",
    "541": "[RB.1.4]1.2.5.1. If the contributing children bag does not contain a value of False Or Unknown Then",
    "1147": "[RB.1.4]1.2.5.1.1. Set status change to True",
    "938": "[RB.1.4]1.2.6. Case: the Rollup Child Activity Set is Any",
    "923": "[RB.1.4]1.2.6. Case: the Rollup Child Activity Set is None",
    "694": "[RB.1.4]1.2.6.1. If the contributing children bag contains a value of True Then",
    "546": "[RB.1.4]1.2.6.1. If the contributing children bag does not contain a value of True Or Unknown Then",
    "1148": "[RB.1.4]1.2.6.1.1. Set status change to True",
    "816": "[RB.1.4]1.2.7. Case: the Rollup Child Activity Set is At Least Count",
    "924": "[RB.1.4]1.2.7. Case: the Rollup Child Activity Set is None",
    "547": "[RB.1.4]1.2.7.1. If the contributing children bag does not contain a value of True Or Unknown Then",
    "271": "[RB.1.4]1.2.7.1. If the count of True values contained in the contributing children bag equals or exceeds the Rollup Minimum Count of the rule Then",
    "1149": "[RB.1.4]1.2.7.1.1. Set status change to True",
    "817": "[RB.1.4]1.2.8. Case: the Rollup Child Activity Set is At Least Count",
    "793": "[RB.1.4]1.2.8. Case: the Rollup Child Activity Set is At Least Percent",
    "272": "[RB.1.4]1.2.8.1. If the count of True values contained in the contributing children bag equals or exceeds the Rollup Minimum Count of the rule Then",
    "118": "[RB.1.4]1.2.8.1. If the percentage (normalized between 0..1, inclusive) of True values contained in the contributing children bag equals or exceeds the Rollup Minimum Percent of the rule Then",
    "1150": "[RB.1.4]1.2.8.1.1. Set status change to True",
    "794": "[RB.1.4]1.2.9. Case: the Rollup Child Activity Set is At Least Percent",
    "1151": "[RB.1.4]1.2.9. If status change is True Then",
    "119": "[RB.1.4]1.2.9.1. If the percentage (normalized between 0..1, inclusive) of True values contained in the contributing children bag equals or exceeds the Rollup Minimum Percent of the rule Then",
    "1152": "[RB.1.4]1.2.9.1.1. Set status change to True",
    "420": "[RB.1.4]2. Exit Rollup Rule Check Subprocess (Evaluation: False) No rules evaluated to true - do not perform any action",
    "869": "[RB.1.5] Adding activity to collection of rolled up activities.",
    "905": "[RB.1.5] No tracking data changed, stopping further rollup.",
    "256": "[RB.1.5]1. Form the activity path as the ordered series of activities from the root of the activity tree to the activity, inclusive, in reverse order.",
    "1127": "[RB.1.5]2. If the activity path is Empty Then",
    "896": "[RB.1.5]2.1. Exit Overall Rollup Process - Nothing to rollup",
    "1054": "[RB.1.5]3. For each activity in the activity path",
    "551": "[RB.1.5]3.1. If the activity has children Then (Only apply Measure Rollup to non-leaf activities)",
    "564": "[RB.1.5]3.1.1. Apply the Measure Rollup Process to the activity (Rollup the activity's measure)",
    "454": "[RB.1.5]3.1.2. Apply the Completion Measure Rollup Process to the activity (Rollup the activity\ufffds progress measure.)",
    "731": "[RB.1.5]3.2. Apply the appropriate Objective Rollup Process to the activity",
    "115": "[RB.1.5]3.2. Apply the appropriate Objective Rollup Process to the activity (Apply the appropriate behavior described in section RB.1.2, based on the activity's defined sequencing information)",
    "782": "[RB.1.5]3.3. Apply the Activity Progress Rollup Process to the activity",
    "126": "[RB.1.5]3.3. Apply the Activity Progress Rollup Process to the activity (Apply the appropriate behavior described in section RB.1.3, based on the activity's defined sequencing information)",
    "261": "[RB.1.5]3.3. Apply the appropriate Activity Progress Rollup Process to the activity (R.S.:Apply the Activity Progress Rollup Process to the activity)",
    "1282": "[RB.1.5]4. Exit Overall Rollup Process",
    "488": "[SB.2.10]1. If the Current Activity is Not Defined Then (Make sure the sequencing session has already begun)",
    "433": "[SB.2.10]1.1. Exit Retry Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.10-1) (Nothing to deliver)",
    "101": "[SB.2.10]2. If the Activity is Active for the Current Activity is True Or the Activity is Suspended for the Current Activity is True Then (Cannot retry an activity that is still active or suspended)",
    "434": "[SB.2.10]2.1. Exit Retry Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.10-2) (Nothing to deliver)",
    "975": "[SB.2.10]3. If the Current Activity is not a leaf Then",
    "372": "[SB.2.10]3.1. Apply the Flow Subprocess to the Current Activity in the Forward direction with consider children equal to True",
    "951": "[SB.2.10]3.2. If the Flow Subprocess returned False Then",
    "407": "[SB.2.10]3.2.1. Exit Retry Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.10-3) (Nothing to deliver)",
    "1655": "[SB.2.10]3.3. Else",
    "322": "[SB.2.10]3.3.1. Exit Retry Sequencing Request Process (Delivery Request: the activity identified by the Flow Subprocess; Exception: n/a)",
    "511": "[SB.2.10]3.a. (step not in pseudo code) Reset activity data for the re-tried activity and its children (",
    "830": "[SB.2.10]3.a.1 If objectives global to system is false (obj global=",
    "1201": "[SB.2.10]3.a.2 Reset any global objectives",
    "1704": "[SB.2.10]4. Else",
    "489": "[SB.2.10]4.1. Exit Retry Sequencing Request Process (Delivery Request: the Current Activity; Exception: n/a)",
    "490": "[SB.2.11]1. If the Current Activity is Not Defined Then (Make sure the sequencing session has already begun)",
    "512": "[SB.2.11]1.1. Exit Exit Sequencing Request Process (End Sequencing Session: False; Exception: SB.2.11-1)",
    "323": "[SB.2.11]2. If the Activity is Active for the Current Activity is True Then (Make sure the current activity has already been terminated)",
    "513": "[SB.2.11]2.1. Exit Exit Sequencing Request Process (End Sequencing Session: False; Exception: SB.2.11-2)",
    "763": "[SB.2.11]3. If the Current Activity is the root of the activity tree Then",
    "219": "[SB.2.11]3.1. Exit Exit Sequencing Request Process (End Sequencing Session: True; Exception: n/a) (The sequencing session has ended, return control to the LTS)",
    "556": "[SB.2.11]4. Exit Exit Sequencing Request Process (End Sequencing Session: False; Exception: n/a)",
    "1128": "[SB.2.12]1. Case: sequencing request is Start",
    "952": "[SB.2.12]1.1. Apply the Start Sequencing Request Process",
    "695": "[SB.2.12]1.2. If the Start Sequencing Request Process returns an exception Then",
    "81": "[SB.2.12]1.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Start Sequencing Request Process)",
    "1656": "[SB.2.12]1.3. Else",
    "42": "[SB.2.12]1.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Start Sequencing Request Process; End Sequencing Session: as identified by the Start Sequencing Request Process; Exception: n/a)",
    "122": "[SB.2.12]1.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Start Sequencing Request Process; End Sequencing Session: n/a; Exception: n/a)",
    "1034": "[SB.2.12]2. Case: sequencing request is Resume All",
    "885": "[SB.2.12]2.1. Apply the Resume All Sequencing Request Process",
    "646": "[SB.2.12]2.2. If the Resume All Sequencing Request Process returns an exception Then",
    "71": "[SB.2.12]2.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Resume All Sequencing Request Process)",
    "1657": "[SB.2.12]2.3. Else",
    "108": "[SB.2.12]2.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Resume All Sequencing Request Process; End Sequencing Session: n/a; Exception: n/a)",
    "1153": "[SB.2.12]3. Case: sequencing request is Exit",
    "962": "[SB.2.12]3.1. Apply the Exit Sequencing Request Process",
    "701": "[SB.2.12]3.2. If the Exit Sequencing Request Process returns an exception Then",
    "83": "[SB.2.12]3.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Exit Sequencing Request Process)",
    "1658": "[SB.2.12]3.3. Else",
    "125": "[SB.2.12]3.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: n/a; End Sequencing Session: the result of the Exit Sequencing Request Process; Exception: n/a)",
    "1129": "[SB.2.12]4. Case: sequencing request is Retry",
    "953": "[SB.2.12]4.1. Apply the Retry Sequencing Request Process",
    "82": "[SB.2.12]4.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Retry Sequencing Request Process)",
    "1659": "[SB.2.12]4.3. Else",
    "116": "[SB.2.12]4.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Retry Sequencing Request Process; End Sequencing Session: n/a) ; Exception: n/a)",
    "1070": "[SB.2.12]5. Case: sequencing request is Continue",
    "906": "[SB.2.12]5.1. Apply the Continue Sequencing Request Process",
    "661": "[SB.2.12]5.2. If the Continue Sequencing Request Process returns an exception Then",
    "27": "[SB.2.12]5.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: Value from Continue Sequencing Request Process; Exception: the exception identified by the Continue Sequencing Request Process)",
    "72": "[SB.2.12]5.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Continue Sequencing Request Process)",
    "1660": "[SB.2.12]5.3. Else",
    "37": "[SB.2.12]5.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Continue Sequencing Request Process; End Sequencing Session: as identified by the Continue Sequencing Request Process;; Exception: n/a)",
    "112": "[SB.2.12]5.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Continue Sequencing Request Process; End Sequencing Session: n/a; Exception: n/a)",
    "1071": "[SB.2.12]6. Case: sequencing request is Previous",
    "907": "[SB.2.12]6.1. Apply the Previous Sequencing Request Process",
    "662": "[SB.2.12]6.2. If the Previous Sequencing Request Process returns an exception Then",
    "73": "[SB.2.12]6.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Previous Sequencing Request Process)",
    "1661": "[SB.2.12]6.3. Else",
    "113": "[SB.2.12]6.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Previous Sequencing Request Process; End Sequencing Session: n/a; Exception: n/a)",
    "1110": "[SB.2.12]7. Case: sequencing request is Choice",
    "939": "[SB.2.12]7.1. Apply the Choice Sequencing Request Process",
    "683": "[SB.2.12]7.2. If the Choice Sequencing Request Process returns an exception Then",
    "77": "[SB.2.12]7.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Choice Sequencing Request Process)",
    "1662": "[SB.2.12]7.3. Else",
    "120": "[SB.2.12]7.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request: the result of the Choice Sequencing Request Process; End Sequencing Session: n/a; Exception: n/a)",
    "1154": "[SB.2.12]8. Case: sequencing request is Jump",
    "963": "[SB.2.12]8.1. Apply the Jump Sequencing Request Process",
    "702": "[SB.2.12]8.2. If the Jump Sequencing Request Process returns an exception Then",
    "84": "[SB.2.12]8.2.1. Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: the exception identified by the Jump Sequencing Request Process)",
    "1663": "[SB.2.12]8.3. Else",
    "123": "[SB.2.12]8.3.1. Exit Sequencing Request Process (Sequencing Request: Valid; Delivery Request:  the result of the Jump Sequencing Request Process; End Sequencing Session: n/a; Exception: n/a)",
    "150": "[SB.2.12]8.Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: SB.2.12-1) (Invalid sequencing request)",
    "151": "[SB.2.12]9.Exit Sequencing Request Process (Sequencing Request: Not Valid; Delivery Request: n/a; End Sequencing Session: n/a; Exception: SB.2.12-1) (Invalid sequencing request)",
    "483": "[SB.2.13]1. If the Current Activity is not Defined Then (Make sure the sequencing session has already begun.)",
    "435": "[SB.2.13]1.1. Exit Jump Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.13-1) (Nothing to deliver.)",
    "351": "[SB.2.13]2. Exit Jump Sequencing Request Process (Delivery Request: the activity identified by the target activity; Exception: n/a)",
    "1202": "[SB.2.1]1. Set reversed direction to False",
    "24": "[SB.2.1]2. If (previous traversal direction is Defined And is Backward) And the activity is the last activity in the activity's parent's list of Available Children Then (Test if we have skipped all of the children in a forward only cluster moving backward)",
    "1155": "[SB.2.1]2.1. traversal direction is Backward",
    "552": "[SB.2.1]2.2. activity is the first activity in the activity's parent's list of Available Children",
    "1174": "[SB.2.1]2.3. Set reversed direction to True",
    "986": "[SB.2.1]3. If the traversal direction is Forward Then",
    "266": "[SB.2.1]3.1. If the activity is the last activity in a forward preorder tree traversal of the activity tree Then (Cannot walk off the activity tree)",
    "20": "[SB.2.1]3.1. If the activity is the last available activity in a forward preorder tree traversal of the activity tree Or (the activity is the Root of the Activity Tree And consider children is False) Then (Walking off the tree causes the sequencing session to end)",
    "572": "[SB.2.1]3.1.1. Apply the Terminate Descendent Attempt Process to the root of the activity tree",
    "436": "[SB.2.1]3.1.1. Exit Flow Tree Traversal Subprocess (Next Activity: Nil; Traversal Direction: n/a; Exception: SB.2.1-1)",
    "174": "[SB.2.1]3.1.2. Exit Flow Tree Traversal Subprocess (Next Activity: n/a; End Sequencing Session: True; Exception: n/a) - Continuing past the last activity, exiting the course",
    "764": "[SB.2.1]3.2. If the activity is a leaf Or consider children is False Then",
    "478": "[SB.2.1]3.2.1. If the activity is the last activity in the activity's parent's list of Available Children Then",
    "28": "[SB.2.1]3.2.1.1. Apply the Flow Tree Traversal Subprocess to the activity's parent in the Forward direction and a previous traversal direction of n/a with consider children equal to False (Recursion - Move to the activity's parent's next forward sibling)",
    "225": "[SB.2.1]3.2.1.2. Exit Flow Tree Traversal Subprocess (Return the results of the recursive Flow Tree Traversal Subprocess) (Return the result of the recursion)",
    "1632": "[SB.2.1]3.2.2. Else",
    "298": "[SB.2.1]3.2.2.1. Traverse the tree, forward preorder, one activity to the next activity, in the activity's parent's list of Available Children",
    "201": "[SB.2.1]3.2.2.2.Exit Flow Tree Traversal Subprocess (Next Activity: the activity identified by the traversal; Traversal Direction: traversal direction; Exception: n/a)",
    "1156": "[SB.2.1]3.3. Else Entering a cluster Forward",
    "392": "[SB.2.1]3.3.1. If the activity's list of Available Children is Not Empty Then Make sure this activity has a child activity",
    "332": "[SB.2.1]3.3.1.1. Exit Flow Tree Traversal Subprocess (Next Activity: the first activity in the activity's list of Available Children (",
    "1633": "[SB.2.1]3.3.2. Else",
    "421": "[SB.2.1]3.3.2.1. Exit Flow Tree Traversal Subprocess (Next Activity Nil; Traversal Direction: n/a; Exception: SB.2.1-2)",
    "976": "[SB.2.1]4. If the traversal direction is Backward Then",
    "437": "[SB.2.1]4.1.1. Exit Flow Tree Traversal Subprocess (Next Activity: Nil; Traversal Direction: n/a; Exception: SB.2.1-3)",
    "465": "[SB.2.1]4.1.If the activity is the root activity of the tree Then (Cannot walk off the root of the activity tree)",
    "765": "[SB.2.1]4.2. If the activity is a leaf Or consider children is False Then",
    "337": "[SB.2.1]4.2.1. If reversed direction is False Then (Only test 'forward only' if we are not going to leave this forward only cluster.)",
    "317": "[SB.2.1]4.2.1.1. If Sequencing Control Forward Only for the parent of the activity is True Then (Test the control mode before traversing)",
    "393": "[SB.2.1]4.2.1.1.1. Exit Flow Tree Traversal Subprocess (Next Activity: Nil; Traversal Direction: n/a; Exception: SB.2.1-4)",
    "471": "[SB.2.1]4.2.2. If the activity is the first activity in the activity's parent's list of Available Children Then",
    "25": "[SB.2.1]4.2.2.1. Apply the Flow Tree Traversal Subprocess to the activity's parent in the Backward direction and a previous traversal direction of n/a with consider children equal to False (Recursion - Move to the activity's parent's next backward sibling)",
    "226": "[SB.2.1]4.2.2.2. Exit Flow Tree Traversal Subprocess (Return the results of the recursive Flow Tree Traversal Subprocess) (Return the result of the recursion)",
    "1634": "[SB.2.1]4.2.3. Else",
    "267": "[SB.2.1]4.2.3.1. Traverse the tree, reverse preorder, one activity to the previous activity, from the activity's parent's list of Available Children",
    "809": "[SB.2.1]4.2.3.2. Exit Flow Tree Traversal Subprocess (Next Activity: ",
    "1094": "[SB.2.1]4.3. Else (Entering a cluster Backward)",
    "376": "[SB.2.1]4.3.1. If the activity's list of Available Children is Not Empty Then (Make sure this activity has a child activity)",
    "49": "[SB.2.1]4.3.1.1.1. Exit Flow Tree Traversal Subprocess (Next Activity: the first activity in the activity's list of Available Children; Traversal Direction: Forward; Exception: n/a) (Start at the beginning of a forward only cluster)",
    "1597": "[SB.2.1]4.3.1.2. Else",
    "43": "[SB.2.1]4.3.1.2.1. Exit Flow Tree Traversal Subprocess (Next Activity: the last activity in the activity's list of Available Children; Traversal Direction: Backward; Exception: n/a) Start at the end of the cluster if we are backing into it",
    "1635": "[SB.2.1]4.3.2. Else",
    "408": "[SB.2.1]4.3.2.1. Exit Flow Tree Traversal Subprocess (Next Activity: Nil; Traversal Direction: n/a; Exception: SB.2.1-2)",
    "458": "[SB.2.2]1. If Sequencing Control Flow for the parent of the activity is False Then (Confirm that 'flow' is enabled)",
    "388": "[SB.2.2]1.1. Exit Flow Activity Traversal Subprocess (Deliverable: False; Next Activity: the activity; Exception: SB.2.2-1)",
    "535": "[SB.2.2]2. Apply the Sequencing Rules Check Process to the activity and its Skipped sequencing rules",
    "358": "[SB.2.2]3. If the Sequencing Rules Check Process does not return Nil Then (Activity is skipped, try to go to the 'next' activity)",
    "185": "[SB.2.2]3.1. Apply the Flow Tree Traversal Subprocess to the activity in the traversal direction and the previous traversal direction with consider children equal to False",
    "636": "[SB.2.2]3.2. If the Flow Tree Traversal Subprocess does not identify an activity Then",
    "157": "[SB.2.2]3.2.1. Exit Flow Activity Traversal Subprocess (Deliverable: False; Next Activity: the activity; Exception: exception identified by the Flow Tree Traversal Subprocess)",
    "32": "[SB.2.2]3.2.1. Exit Flow Activity Traversal Subprocess (Deliverable: False; Next Activity: the activity;End Sequencing Session: as identified by the Flow Tree Traversal Subprocess;  Exception: exception identified by the Flow Tree Traversal Subprocess)",
    "1688": "[SB.2.2]3.3. Else",
    "67": "[SB.2.2]3.3.1. If the previous traversal direction is Backward And the Traversal Direction returned by the Flow Tree Traversal Subprocess is Backward Then (Make sure the recursive call considers the correct direction)",
    "35": "[SB.2.2]3.3.1.1. Apply the Flow Activity Traversal Subprocess to the activity identified by the Flow Tree Traversal Subprocess in the traversal direction and a previous traversal direction of n/a (Recursive call \ufffd make sure the 'next' activity is OK)",
    "1636": "[SB.2.2]3.3.2. Else",
    "9": "[SB.2.2]3.3.2.1. Apply the Flow Activity Traversal Subprocess to the activity identified by the Flow Tree Traversal Subprocess in the traversal direction and a previous traversal direction of previous traversal direction (Recursive call \ufffd make sure the 'next' activity is OK)",
    "232": "[SB.2.2]3.3.3. Exit Flow Activity Traversal Subprocess -(Return the results of the recursive Flow Activity Traversal Subprocess) Possible exit from recursion",
    "565": "[SB.2.2]4. Apply the Check Activity Process to the activity (Make sure the activity is allowed)",
    "925": "[SB.2.2]5. If the Check Activity Process returns True Then",
    "389": "[SB.2.2]5.1. Exit Flow Activity Traversal Subprocess (Deliverable: False; Next Activity: the activity; Exception: SB.2.2-2)",
    "280": "[SB.2.2]6. If the activity is not a leaf node in the activity tree Then (Cannot deliver a non-leaf activity; enter the cluster looking for a leaf)",
    "158": "[SB.2.2]6.1. Apply the Flow Tree Traversal Subprocess to the activity in the traversal direction and a previous traversal direction of n/a with consider children equal to True",
    "637": "[SB.2.2]6.2. If the Flow Tree Traversal Subprocess does not identify an activity Then",
    "33": "[SB.2.2]6.2.1. Exit Flow Activity Traversal Subprocess (Deliverable: False; Next Activity: the activity; End Sequencing Session: as identified by the Flow Tree Traversal Subprocess; Exception: exception identified by the Flow Tree Traversal Subprocess)",
    "159": "[SB.2.2]6.2.1. Exit Flow Activity Traversal Subprocess (Deliverable: False; Next Activity: the activity; Exception: exception identified by the Flow Tree Traversal Subprocess)",
    "1689": "[SB.2.2]6.3. Else",
    "44": "[SB.2.2]6.3.1. If the traversal direction is Backward And the traversal direction returned by the Flow Tree Traversal Subprocess is Forward Then (Check if we are flowing backward through a forward only cluster - must move forward instead)",
    "22": "[SB.2.2]6.3.1.1. Apply the Flow Activity Traversal Subprocess to the activity identified by the Flow Tree Traversal Subprocess in the Forward direction with the previous traversal direction of Backward (Recursive call \ufffd Make sure the identified activity is OK)",
    "1637": "[SB.2.2]6.3.2. Else",
    "29": "[SB.2.2]6.3.2.1. Apply the Flow Activity Traversal Subprocess to the activity identified by the Flow Tree Traversal Subprocess in the traversal direction and a previous traversal direction of n/a (Recursive call \ufffd Make sure the identified activity is OK)",
    "227": "[SB.2.2]6.3.3. Exit Flow Activity Traversal Subprocess - (Return the results of the recursive Flow Activity Traversal Subprocess) Possible exit from recursion",
    "359": "[SB.2.2]7. Exit Flow Activity Traversal Subprocess (Deliverable: True; Next Activity: the activity; Exception: n/a ) Found a leaf",
    "508": "[SB.2.3]1. The candidate activity is the activity The candidate activity is where we start 'flowing' from",
    "4": "[SB.2.3]2. Apply the Flow Tree Traversal Subprocess to the candidate activity in the traversal direction and a previous traversal direction of n/a with consider children equal to the consider children flag (Attempt to move away from the starting activity, one activity in the specified direction)",
    "491": "[SB.2.3]3. If the Flow Tree Traversal Subprocess does not identify an activity Then (No activity to move to)",
    "41": "[SB.2.3]3.1. Exit Flow Subprocess (Identified Activity: candidate activity; Deliverable: False; End Sequencing Session: as identified by the Flow Tree Traversal Subprocess; Exception: exception identified by the Flow Tree Traversal Subprocess)",
    "205": "[SB.2.3]3.1. Exit Flow Subprocess (Identified Activity: candidate activity; Deliverable: False; Exception: exception identified by the Flow Tree Traversal Subprocess)",
    "1718": "[SB.2.3]4. Else",
    "557": "[SB.2.3]4.1. Candidate activity is the activity identified by the Flow Tree Traversal Subprocess",
    "48": "[SB.2.3]4.2. Apply the Flow Activity Traversal Subprocess to the candidate activity in the traversal direction and a previous traversal direction of n/a (Validate the candidate activity and traverse until a valid leaf is encountered)",
    "17": "[SB.2.3]4.3.Exit Flow Subprocess (Identified Activity: the activity identified by the Flow Activity Traversal Subprocess; Deliverable: as identified by the Flow Activity Traversal Subprocess; Exception: exception identified by the Flow Activity Traversal Subprocess)",
    "0": "[SB.2.3]4.3.Exit Flow Subprocess (Identified Activity: the activity identified by the Flow Activity Traversal Subprocess; Deliverable: as identified by the Flow Activity Traversal Subprocess;End Sequencing Session: value identified by the Flow Activity Traversal Subprocess; Exception: exception identified by the Flow Activity Traversal Subprocess)",
    "987": "[SB.2.4]1. If the traversal direction is Forward Then",
    "445": "[SB.2.4]1.1. Apply the Sequencing Rules Check Process to the activity and the Stop Forward Traversal sequencing rules",
    "732": "[SB.2.4]1.2. If the Sequencing Rules Check Process does not return Nil Then",
    "558": "[SB.2.4]1.2.1. Exit Choice Activity Traversal Subprocess (Reachable: False; Exception: SB.2.4-1)",
    "612": "[SB.2.4]1.3. Exit Choice Activity Traversal Subprocess (Reachable: True; Exception: n/a )",
    "977": "[SB.2.4]2. If the traversal direction is Backward Then",
    "1111": "[SB.2.4]2.1. If the activity has a parent Then",
    "584": "[SB.2.4]2.1.1. If Sequencing Control Forward Only for the parent of the activity is True Then",
    "548": "[SB.2.4]2.1.1.1. Exit Choice Activity Traversal Subprocess (Reachable: False; Exception: SB.2.4-2)",
    "1638": "[SB.2.4]2.1.2. Else",
    "237": "[SB.2.4]2.1.2.1. Exit Choice Activity Traversal Subprocess (Reachable: False; Exception: SB.2.4-3) (Cannot walk backward from the root of the activity tree)",
    "613": "[SB.2.4]2.2. Exit Choice Activity Traversal Subprocess (Reachable: True; Exception: n/a )",
    "498": "[SB.2.5]1. If the Current Activity is Defined Then (Make sure the sequencing session has not already begun)",
    "455": "[SB.2.5]1.1. Exit Start Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.5-1) (Nothing to deliver)",
    "318": "[SB.2.5]2. If the root of the activity tree is a leaf Then (Before starting, make sure the activity tree contains more than one activity)",
    "240": "[SB.2.5]2.1. Exit Start Sequencing Request Process (Delivery Request: the root of the activity tree; Exception: n/a) (Only one activity, it must be a leaf)",
    "315": "[SB.2.5]2.5 Rustici Extension - This course has a property that indicates we should always flow to the first SCO, so find it and return it",
    "1055": "[SB.2.5]2.5.1. Get the ordered list of activities",
    "926": "[SB.2.5]2.5.2. Loop to find the first deliverable activity",
    "1705": "[SB.2.5]3. Else ",
    "164": "[SB.2.5]3.1. Apply the Flow Subprocess to the root of the activity tree in the Forward direction with consider children equal to True (Attempt to flow into the activity tree)",
    "978": "[SB.2.5]3.2. If the Flow Subprocess returns False Then",
    "65": "[SB.2.5]3.2.1. Exit Start Sequencing Request Process (Delivery Request: n/a; End Sequencing Session: as identified by the Flow Subprocess; Exception: the exception identified by the Flow Subprocess) (Nothing to deliver)",
    "233": "[SB.2.5]3.2.1. Exit Start Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Flow Subprocess) (Nothing to deliver)",
    "1664": "[SB.2.5]3.3. Else ",
    "325": "[SB.2.5]3.3.1. Exit Start Sequencing Request Process (Delivery Request: the activity identified by the Flow Subprocess; Exception: n/a)",
    "499": "[SB.2.6]1. If the Current Activity is Defined Then (Make sure the sequencing session has not already begun)",
    "400": "[SB.2.6]1.1. Exit Resume All Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.6-1) (Nothing to deliver)",
    "401": "[SB.2.6]2.1. Exit Resume All Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.6-2) (Nothing to deliver)",
    "58": "[SB.2.6]3.Exit Resume All Sequencing Request Process (Delivery Request: the activity identified by the Suspended Activity; Exception: n/a) (The Delivery Request Process validates that the Suspended Activity can be delivered)",
    "500": "[SB.2.7]1. If the Current Activity is Not Defined Then (Make sure the sequencing session has already begun)",
    "422": "[SB.2.7]1.1. Exit Continue Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.7-1) (Nothing to deliver)",
    "709": "[SB.2.7]2. If the activity is not the root activity of the activity tree Then",
    "299": "[SB.2.7]2.1. If Sequencing Control Flow for the parent of the activity is False Then (Confirm a 'flow' traversal is allowed from the activity)",
    "566": "[SB.2.7]2.1.1. Exit Flow Tree Traversal Subprocess (Delivery Request: n/a; Exception: SB.2.7-2)",
    "585": "[SB.2.7]2.1.1. Exit Flow Tree Traversal Subprocess (Next Activity: Nil; Exception: SB.2.7-2 )",
    "136": "[SB.2.7]3. Apply the Flow Subprocess to the Current Activity in the Forward direction with consider children equal to False (Flow in a forward direction to the next allowed activity)",
    "994": "[SB.2.7]4. If the Flow Subprocess returns False Then",
    "63": "[SB.2.7]4.1. Exit Continue Sequencing Request Process (Delivery Request: n/a; End Sequencing Session: as identified by the Flow Subprocess; Exception: the exception identified by the Flow Subprocess) (Nothing to deliver)",
    "228": "[SB.2.7]4.1. Exit Continue Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Flow Subprocess) (Nothing to deliver)",
    "1719": "[SB.2.7]5. Else",
    "319": "[SB.2.7]5.1. Exit Continue Sequencing Request Process (Delivery Request: the activity identified by the Flow Subprocess; Exception: n/a )",
    "501": "[SB.2.8]1. If the Current Activity is Not Defined Then (Make sure the sequencing session has already begun)",
    "409": "[SB.2.8]1.1. Exit Previous Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.8-1 ) (Nothing to deliver)",
    "710": "[SB.2.8]2. If the activity is not the root activity of the activity tree Then",
    "300": "[SB.2.8]2.1. If Sequencing Control Flow for the parent of the activity is False Then (Confirm a 'flow' traversal is allowed from the activity)",
    "567": "[SB.2.8]2.1.1. Exit Flow Tree Traversal Subprocess (Delivery Request: n/a; Exception: SB.2.8-2)",
    "593": "[SB.2.8]2.1.1. Exit Flow Tree Traversal Subprocess (Next Activity: Nil; Exception: SB.2.8-2)",
    "131": "[SB.2.8]3. Apply the Flow Subprocess to the Current Activity in the Backward direction with consider children equal to False (Flow in a backward direction to the next allowed activity)",
    "995": "[SB.2.8]4. If the Flow Subprocess returns False Then",
    "229": "[SB.2.8]4.1. Exit Previous Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Flow Subprocess) (Nothing to deliver)",
    "1720": "[SB.2.8]5. Else",
    "324": "[SB.2.8]5.1. Exit Previous Sequencing Request Process (Delivery Request: the activity identified by the Flow Subprocess; Exception: n/a)",
    "128": "[SB.2.9.1]1. Apply the Choice Flow Tree Traversal Subprocess to the activity in the traversal direction (Attempt to move away from the activity, 'one' activity in the specified direction)",
    "733": "[SB.2.9.1]2. If the Choice Flow Tree Traversal Subprocess returned Nil Then",
    "711": "[SB.2.9.1]2.1. Exit Choice Flow Subprocess (Identified Activity the activity)",
    "1690": "[SB.2.9.1]3. Else",
    "338": "[SB.2.9.1]3.1. Exit Choice Flow Subprocess (Identified Activity the activity identified by the Choice Flow Tree Traversal Subprocess)",
    "964": "[SB.2.9.2]1. If the traversal direction is Forward Then",
    "257": "[SB.2.9.2]1.1. If the activity is the last activity in a forward preorder tree traversal of the activity tree Then (Cannot walk off the activity tree)",
    "74": "[SB.2.9.2]1.1. If the activity is the last available activity in a forward preorder tree traversal of the activity tree Or (the activity is the Root of the Activity Tree) Then (Cannot walk off the activity tree)",
    "684": "[SB.2.9.2]1.1.1. Exit Choice Flow Tree Traversal Subprocess (Next Activity: Nil)",
    "479": "[SB.2.9.2]1.2. If the activity is the last activity in the activity's parent's list of Available Children Then",
    "137": "[SB.2.9.2]1.2.1.  Apply the Choice Flow Tree Traversal Subprocess to the activity's parent in the Forward direction (Recursion - Move to the activity's parent's next forward sibling)",
    "143": "[SB.2.9.2]1.2.2. Exit Choice Flow Tree Traversal Subprocess (Next Activity: the results of the recursive Choice Flow Tree Traversal Subprocess) (Return the result of the recursion)",
    "1639": "[SB.2.9.2]1.3. Else",
    "301": "[SB.2.9.2]1.3.1. Traverse the tree, forward preorder, one activity to the next activity, in the activity's parent's list of Available Children",
    "446": "[SB.2.9.2]1.3.2. Exit Choice Flow Tree Traversal Subprocess (Next Activity: the activity identified by the traversal)",
    "954": "[SB.2.9.2]2. If the traversal direction is Backward Then",
    "456": "[SB.2.9.2]2.1. If the activity is the root activity of the tree Then (Cannot walk off the root of the activity tree)",
    "685": "[SB.2.9.2]2.1.1. Exit Choice Flow Tree Traversal Subprocess (Next Activity: Nil)",
    "472": "[SB.2.9.2]2.2. If the activity is the first activity in the activity's parent's list of Available Children Then",
    "135": "[SB.2.9.2]2.2.1. Apply the Choice Flow Tree Traversal Subprocess to the activity's parent in the Backward direction (Recursion \ufffd Move to the activity's parent's next backward sibling)",
    "138": "[SB.2.9.2]2.2.1.1. Exit Choice Flow Tree Traversal Subprocess (Next Activity: the results of the recursive Choice Flow Tree Traversal Subprocess) (Return the result of the recursion)",
    "1640": "[SB.2.9.2]2.3. Else",
    "268": "[SB.2.9.2]2.3.1. Traverse the tree, reverse preorder, one activity to the previous activity, from the activity's parent's list of Available Children",
    "447": "[SB.2.9.2]2.3.2. Exit Choice Flow Tree Traversal Subprocess (Next Activity: the activity identified by the traversal)",
    "502": "[SB.2.9]1. If there is no target activity Then (There must be a target activity for choice) targetActivity=",
    "448": "[SB.2.9]1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-1) (Nothing to deliver)",
    "210": "[SB.2.9]10. Case: Current Activity and common ancestor are the same Or Current Activity is Not Defined (Case #3 - path to the target is forward in the activity tree)",
    "287": "[SB.2.9]10. Case: Target activity is the common ancestor of the Current Activity (Case #4 - path to the target is backward in the activity tree)",
    "344": "[SB.2.9]10.1. Form the activity path as the ordered series of activities from the Current Activity to the target activity, inclusive",
    "242": "[SB.2.9]10.1. Form the activity path as the ordered series of activities from the common ancestor to the target activity, exclusive of the target activity",
    "1072": "[SB.2.9]10.2. If the activity path is Empty Then",
    "410": "[SB.2.9]10.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-5) (Nothing to deliver)",
    "996": "[SB.2.9]10.3. For each activity on the activity path",
    "515": "[SB.2.9]10.3.1. Apply the Choice Activity Traversal Subprocess to the activity in the Forward direction",
    "663": "[SB.2.9]10.3.1. If the activity is not the last activity in the activity path Then",
    "196": "[SB.2.9]10.3.1.1. If the Sequencing Control Choice Exit for the activity is False Then (Make sure an activity that should not exit will exit if the target is delivered)",
    "573": "[SB.2.9]10.3.1.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: ",
    "703": "[SB.2.9]10.3.2. If the Choice Activity Traversal Subprocess returns False Then",
    "139": "[SB.2.9]10.3.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Choice Activity Traversal Subprocess) (Nothing to deliver)",
    "18": "[SB.2.9]10.3.3. If Activity is Active for the activity is False And (the activity is Not the common ancestor And adlseq:preventActivation for the activity is True) Then (If the activity being considered is not already active, make sure we are allowed to activate it)",
    "394": "[SB.2.9]10.3.3.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-6) (Nothing to deliver)",
    "1438": "[SB.2.9]10.4. Break All Cases",
    "288": "[SB.2.9]11. Case: Target activity is the common ancestor of the Current Activity (Case #4 - path to the target is backward in the activity tree)",
    "251": "[SB.2.9]11.1. Form the activity path as the ordered series of activities from the Current Activity to the common ancestor, excluding the common ancestor",
    "345": "[SB.2.9]11.1. Form the activity path as the ordered series of activities from the Current Activity to the common ancestor, inclusive",
    "346": "[SB.2.9]11.1. Form the activity path as the ordered series of activities from the Current Activity to the target activity, inclusive",
    "1417": "[SB.2.9]11.10. Break All Cases",
    "1073": "[SB.2.9]11.2. If the activity path is Empty Then",
    "411": "[SB.2.9]11.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-5) (Nothing to deliver)",
    "997": "[SB.2.9]11.3. For each activity on the activity path",
    "1009": "[SB.2.9]11.3. Set constrained activity to Undefined",
    "664": "[SB.2.9]11.3.1. If the activity is not the last activity in the activity path Then",
    "197": "[SB.2.9]11.3.1.1. If the Sequencing Control Choice Exit for the activity is False Then (Make sure an activity that should not exit will exit if the target is delivered)",
    "377": "[SB.2.9]11.3.1.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-7) (Nothing to deliver)",
    "1439": "[SB.2.9]11.4. Break All Cases",
    "574": "[SB.2.9]11.4. For each activity on the activity path (Walk up the tree to the common ancestor)",
    "206": "[SB.2.9]11.4.1. If the Sequencing Control Choice Exit for the activity is False Then - Make sure an activity that should not exit will exit if the target is delivered",
    "665": "[SB.2.9]11.4.1. If the activity is not the last activity in the activity path Then",
    "594": "[SB.2.9]11.4.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: ",
    "198": "[SB.2.9]11.4.1.1. If the Sequencing Control Choice Exit for the activity is False Then - Make sure an activity that should not exit will exit if the target is delivered",
    "575": "[SB.2.9]11.4.1.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: ",
    "402": "[SB.2.9]11.4.2. If constrained activity is Undefined Then (Find the closest constrained activity to the current activity)",
    "734": "[SB.2.9]11.4.2.1. If adlseq:constrainedChoice for the activity is True Then",
    "927": "[SB.2.9]11.4.2.1.1.Set constrained activity to activity: '",
    "988": "[SB.2.9]11.5. If constrained activity is Defined Then",
    "469": "[SB.2.9]11.5.1. If the target activity is Forward in the activity tree relative to the constrained activity Then",
    "529": "[SB.2.9]11.5.1.1. traverse is Forward ('Flow' in a forward direction to see what activity comes next)",
    "1612": "[SB.2.9]11.5.2. Else",
    "516": "[SB.2.9]11.5.2.1. traverse is Backward ('Flow' in a backward direction to see what activity comes next)",
    "523": "[SB.2.9]11.5.3. Apply the Choice Flow Subprocess to the constrained activity in the traverse direction",
    "559": "[SB.2.9]11.5.4. Set activity to consider to the activity identified by the Choice FlowSubprocess",
    "7": "[SB.2.9]11.5.5. If the target activity is Not an available descendent of the activity to consider And the target activity is Not the activity to consider And the target activity is Not the constrained activity Then (Make sure the target activity is within the set of 'flow' constrained choices)",
    "5": "[SB.2.9]11.5.5. If the target activity is Not an available descendent of the activity to consider And the target activity is Not the activity to considered And the target activity is Not the constrained activity Then (Make sure the target activity is within the set of 'flow' constrained choices)",
    "595": "[SB.2.9]11.5.5.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: ",
    "243": "[SB.2.9]11.6. Form the activity path as the ordered series of activities from the common ancestor to the target activity, exclusive of the target activity",
    "1074": "[SB.2.9]11.7. If the activity path is Empty Then",
    "412": "[SB.2.9]11.7.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-5) (Nothing to deliver)",
    "305": "[SB.2.9]11.8. If the target activity is forward in the activity tree relative to the Current Activity Then (Walk toward the target activity)",
    "979": "[SB.2.9]11.8.1. For each activity on the activity path",
    "234": "[SB.2.9]11.8.1.1. Apply the Choice Activity Traversal Subprocess to the activity in the Forward direction (to check for Stop Forward Traversal violations) i=",
    "686": "[SB.2.9]11.8.1.2. If the Choice Activity Traversal Subprocess returns False Then",
    "132": "[SB.2.9]11.8.1.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Choice Activity Traversal Subprocess) (Nothing to deliver)",
    "15": "[SB.2.9]11.8.1.3. If Activity is Active for the activity is False And(the activity is Not the common ancestor And adlseq:preventActivation for the activity is True) Then (If the activity being considered is not already active, make sure we are allowed to activate it)",
    "576": "[SB.2.9]11.8.1.3.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: ",
    "1665": "[SB.2.9]11.9. Else",
    "980": "[SB.2.9]11.9.1. For each activity on the activity path",
    "577": "[SB.2.9]11.9.1.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: ",
    "289": "[SB.2.9]11.Case: Target activity is forward from the common ancestor activity (Case #5 - target is a descendent activity of the common ancestor)",
    "928": "[SB.2.9]12. If the target activity is a leaf activity Then",
    "492": "[SB.2.9]12.1. Exit Choice Sequencing Request Process (Delivery Request: the target activity; Exception: n/a)",
    "347": "[SB.2.9]12.1. Form the activity path as the ordered series of activities from the Current Activity to the common ancestor, inclusive",
    "1418": "[SB.2.9]12.10. Break All Cases",
    "1075": "[SB.2.9]12.2. If the activity path is Empty Then",
    "413": "[SB.2.9]12.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-5) (Nothing to deliver)",
    "1010": "[SB.2.9]12.3. Set constrained activity to Undefined",
    "578": "[SB.2.9]12.4. For each activity on the activity path (Walk up the tree to the common ancestor)",
    "666": "[SB.2.9]12.4.1. If the activity is not the last activity in the activity path Then",
    "199": "[SB.2.9]12.4.1.1. If the Sequencing Control Choice Exit for the activity is False Then - Make sure an activity that should not exit will exit if the target is delivered",
    "378": "[SB.2.9]12.4.1.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-7) (Nothing to deliver)",
    "403": "[SB.2.9]12.4.2. If constrained activity is Undefined Then (Find the closest constrained activity to the current activity)",
    "735": "[SB.2.9]12.4.2.1. If adlseq:constrainedChoice for the activity is True Then",
    "965": "[SB.2.9]12.4.2.1.1.Set constrained activity to activity",
    "989": "[SB.2.9]12.5. If constrained activity is Defined Then",
    "470": "[SB.2.9]12.5.1. If the target activity is Forward in the activity tree relative to the constrained activity Then",
    "530": "[SB.2.9]12.5.1.1. traverse is Forward ('Flow' in a forward direction to see what activity comes next)",
    "1613": "[SB.2.9]12.5.2. Else",
    "517": "[SB.2.9]12.5.2.1. traverse is Backward ('Flow' in a backward direction to see what activity comes next)",
    "524": "[SB.2.9]12.5.3. Apply the Choice Flow Subprocess to the constrained activity in the traverse direction",
    "560": "[SB.2.9]12.5.4. Set activity to consider to the activity identified by the Choice FlowSubprocess",
    "6": "[SB.2.9]12.5.5. If the target activity is Not an available descendent of the activity to consider And the target activity is Not the activity to considered And the target activity is Not the constrained activity Then (Make sure the target activity is within the set of 'flow' constrained choices)",
    "531": "[SB.2.9]12.5.5.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-8)",
    "244": "[SB.2.9]12.6. Form the activity path as the ordered series of activities from the common ancestor to the target activity, exclusive of the target activity",
    "1076": "[SB.2.9]12.7. If the activity path is Empty Then",
    "414": "[SB.2.9]12.7.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-5) (Nothing to deliver)",
    "306": "[SB.2.9]12.8. If the target activity is forward in the activity tree relative to the Current Activity Then (Walk toward the target activity)",
    "981": "[SB.2.9]12.8.1. For each activity on the activity path",
    "509": "[SB.2.9]12.8.1.1. Apply the Choice Activity Traversal Subprocess to the activity in the Forward direction",
    "687": "[SB.2.9]12.8.1.2. If the Choice Activity Traversal Subprocess returns False Then",
    "133": "[SB.2.9]12.8.1.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Choice Activity Traversal Subprocess) (Nothing to deliver)",
    "16": "[SB.2.9]12.8.1.3. If Activity is Active for the activity is False And(the activity is Not the common ancestor And adlseq:preventActivation for the activity is True) Then (If the activity being considered is not already active, make sure we are allowed to activate it)",
    "379": "[SB.2.9]12.8.1.3.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-6) (Nothing to deliver)",
    "1666": "[SB.2.9]12.9. Else",
    "982": "[SB.2.9]12.9.1. For each activity on the activity path",
    "380": "[SB.2.9]12.9.1.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-6) (Nothing to deliver)",
    "290": "[SB.2.9]12.Case: Target activity is forward from the common ancestor activity (Case #5 - target is a descendent activity of the common ancestor)",
    "51": "[SB.2.9]13. Apply the Flow Subprocess to the target activity in the Forward direction with consider children equal to True (The identified activity is a cluster. Enter the cluster and attempt to find a descendent leaf to deliver)",
    "929": "[SB.2.9]13. If the target activity is a leaf activity Then",
    "493": "[SB.2.9]13.1. Exit Choice Sequencing Request Process (Delivery Request: the target activity; Exception: n/a)",
    "52": "[SB.2.9]14. Apply the Flow Subprocess to the target activity in the Forward direction with consider children equal to True (The identified activity is a cluster. Enter the cluster and attempt to find a descendent leaf to deliver)",
    "252": "[SB.2.9]14. If the Flow Subprocess returns False Then (Nothing to deliver, but we succeeded in reaching the target activity - move the current activity)",
    "647": "[SB.2.9]14.1. Apply the Terminate Descendent Attempts Process to the common ancestor",
    "840": "[SB.2.9]14.2. Apply the End Attempt Process to the common ancestor",
    "886": "[SB.2.9]14.3. Set the Current Activity to the target activity",
    "438": "[SB.2.9]14.4. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-9) (Nothing to deliver)",
    "1706": "[SB.2.9]15. Else",
    "253": "[SB.2.9]15. If the Flow Subprocess returns False Then (Nothing to deliver, but we succeeded in reaching the target activity - move the current activity)",
    "648": "[SB.2.9]15.1. Apply the Terminate Descendent Attempts Process to the common ancestor",
    "310": "[SB.2.9]15.1. Exit Choice Sequencing Request Process (Delivery Request: for the activity identified by the Flow Subprocess; Exception: n/a)",
    "841": "[SB.2.9]15.2. Apply the End Attempt Process to the common ancestor",
    "887": "[SB.2.9]15.3. Set the Current Activity to the target activity",
    "439": "[SB.2.9]15.4. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-9) (Nothing to deliver)",
    "1707": "[SB.2.9]16. Else",
    "311": "[SB.2.9]16.1. Exit Choice Sequencing Request Process (Delivery Request: for the activity identified by the Flow Subprocess; Exception: n/a)",
    "333": "[SB.2.9]2.\tForm the activity path as the ordered series of activities from root of the activity tree to the target activity, inclusive",
    "736": "[SB.2.9]2. If the target activity is not the root of the activity tree Then",
    "217": "[SB.2.9]2.1. If the Available Children for the parent of the target activity does not contain the target activity Then (The activity is currently not available)",
    "423": "[SB.2.9]2.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-2) (Nothing to deliver)",
    "1035": "[SB.2.9]3.\tFor each activity in the activity path\t",
    "316": "[SB.2.9]3. Form the activity path as the ordered series of activities from the root of the activity tree to the target activity, inclusive",
    "795": "[SB.2.9]3.1.\tIf the activity is Not the root of the activity tree Then",
    "262": "[SB.2.9]3.1.1.\tIf the Available Children for the parent of the activity does not contain the activity Then\t(The activity is currently not available.)",
    "395": "[SB.2.9]3.1.1.1.\tExit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-2)\t(Nothing to deliver.)",
    "247": "[SB.2.9]3.2.\tApply the Sequencing Rules Check Process to the activity and the Hide from Choice sequencing rules\t(Cannot choose something that is hidden.)",
    "737": "[SB.2.9]3.3.\tIf the Sequencing Rules Check Process does not return Nil Then",
    "220": "[SB.2.9]3.3.1\tExit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-3)\tNothing to deliver. (Cannot choose something that is hidden.)",
    "1056": "[SB.2.9]4. For each activity in the activity path",
    "254": "[SB.2.9]4.1. Apply the Sequencing Rules Check Process to the activity and the Hide from Choice sequencing rules (Cannot choose something that is hidden)",
    "221": "[SB.2.9]4.1. If the Sequencing Control Mode Choice for the parent of the target activity is False Then (Confirm that control mode allow 'choice' of the target)",
    "424": "[SB.2.9]4.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-4) (Nothing to deliver)",
    "738": "[SB.2.9]4.2. If the Sequencing Rules Check Process does not return Nil Then",
    "425": "[SB.2.9]4.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-3) (Nothing to deliver)",
    "750": "[SB.2.9]4.If the target activity is not the root of the activity tree Then",
    "579": "[SB.2.9]5. If the Current Activity is Defined Then (Has the sequencing session already begun?)",
    "638": "[SB.2.9]5.1. Find the common ancestor of the Current Activity and the target activity",
    "222": "[SB.2.9]5.1. If the Sequencing Control Mode Choice for the parent of the target activity is False Then (Confirm that control mode allow 'choice' of the target)",
    "426": "[SB.2.9]5.1.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-4) (Nothing to deliver)",
    "751": "[SB.2.9]5.If the target activity is not the root of the activity tree Then",
    "1721": "[SB.2.9]6. Else",
    "580": "[SB.2.9]6. If the Current Activity is Defined Then (Has the sequencing session already begun?)",
    "639": "[SB.2.9]6.1. Find the common ancestor of the Current Activity and the target activity",
    "373": "[SB.2.9]6.1. Set common ancestor is the root of the activity tree (No, choosing the target will start the sequencing session)",
    "503": "[SB.2.9]7. Case: Current Activity and target activity are identical (Case #1 - select the current activity)",
    "1722": "[SB.2.9]7. Else",
    "940": "[SB.2.9]7.1. Break All Cases (Nothing to do in this case)",
    "374": "[SB.2.9]7.1. Set common ancestor is the root of the activity tree (No, choosing the target will start the sequencing session)",
    "504": "[SB.2.9]8. Case: Current Activity and target activity are identical (Case #1 - select the current activity)",
    "363": "[SB.2.9]8. Case: Current Activity and the target activity are siblings (Case #2 - same cluster; move toward the target activity)",
    "941": "[SB.2.9]8.1. Break All Cases (Nothing to do in this case)",
    "10": "[SB.2.9]8.1. Form the activity list as the ordered sequence of activities from the Current Activity to the target activity, exclusive of the target activity (We are attempted to walk toward the target activity. Once we reach the target activity, we don't need to test it.)",
    "831": "[SB.2.9]8.2. If the activity list is Empty Then (Nothing to choose)",
    "427": "[SB.2.9]8.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-5) (Nothing to deliver)",
    "449": "[SB.2.9]8.3. If the target activity occurs after the Current Activity in preorder traversal of the activity tree Then",
    "1351": "[SB.2.9]8.3.1. traverse is Forward",
    "1691": "[SB.2.9]8.4. Else",
    "1325": "[SB.2.9]8.4.1. traverse is Backward",
    "1011": "[SB.2.9]8.5. For each activity on the activity list",
    "518": "[SB.2.9]8.5.1. Apply the Choice Activity Traversal Subprocess to the activity in the traverse direction",
    "712": "[SB.2.9]8.5.2. If the Choice Activity Traversal Subprocess returns False Then",
    "140": "[SB.2.9]8.5.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Choice Activity Traversal Subprocess) (Nothing to deliver)",
    "1459": "[SB.2.9]8.6. Break All Cases",
    "213": "[SB.2.9]9. Case: Current Activity and common ancestor are the same Or Current Activity is Not Defined (Case #3 - path to the target is forward in the activity tree)",
    "364": "[SB.2.9]9. Case: Current Activity and the target activity are siblings (Case #2 - same cluster; move toward the target activity)",
    "11": "[SB.2.9]9.1. Form the activity list as the ordered sequence of activities from the Current Activity to the target activity, exclusive of the target activity (We are attempted to walk toward the target activity. Once we reach the target activity, we don't need to test it.)",
    "248": "[SB.2.9]9.1. Form the activity path as the ordered series of activities from the common ancestor to the target activity, exclusive of the target activity",
    "832": "[SB.2.9]9.2. If the activity list is Empty Then (Nothing to choose)",
    "1095": "[SB.2.9]9.2. If the activity path is Empty Then",
    "428": "[SB.2.9]9.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: SB.2.9-5) (Nothing to deliver)",
    "1012": "[SB.2.9]9.3. For each activity on the activity path",
    "450": "[SB.2.9]9.3. If the target activity occurs after the Current Activity in preorder traversal of the activity tree Then",
    "525": "[SB.2.9]9.3.1. Apply the Choice Activity Traversal Subprocess to the activity in the Forward direction",
    "1352": "[SB.2.9]9.3.1. traverse is Forward",
    "713": "[SB.2.9]9.3.2. If the Choice Activity Traversal Subprocess returns False Then",
    "141": "[SB.2.9]9.3.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Choice Activity Traversal Subprocess) (Nothing to deliver)",
    "19": "[SB.2.9]9.3.3. If Activity is Active for the activity is False And (the activity is Not the common ancestor And adlseq:preventActivation for the activity is True) Then (If the activity being considered is not already active, make sure we are allowed to activate it)",
    "603": "[SB.2.9]9.3.3.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: ",
    "1460": "[SB.2.9]9.4. Break All Cases",
    "1692": "[SB.2.9]9.4. Else",
    "1326": "[SB.2.9]9.4.1. traverse is Backward",
    "1013": "[SB.2.9]9.5. For each activity on the activity list",
    "519": "[SB.2.9]9.5.1. Apply the Choice Activity Traversal Subprocess to the activity in the traverse direction",
    "714": "[SB.2.9]9.5.2. If the Choice Activity Traversal Subprocess returns False Then",
    "142": "[SB.2.9]9.5.2.1. Exit Choice Sequencing Request Process (Delivery Request: n/a; Exception: the exception identified by the Choice Activity Traversal Subprocess) (Nothing to deliver)",
    "1461": "[SB.2.9]9.6. Break All Cases",
    "542": "[SCORM Engine Extension] Child Set is Empty and Control.Package.Properties.RollupEmptySetToUnknown=",
    "561": "[SR.1]1. If the activity does not have children Then (Cannot apply selection to a leaf activity)",
    "1257": "[SR.1]1.1. Exit Select Children Process",
    "175": "[SR.1]2. If Activity is Suspended for the activity is True Or the Activity is Active for the activity is True Then (Cannot apply selection to a suspended or active activity)",
    "1258": "[SR.1]2.1. Exit Select Children Process",
    "888": "[SR.1]3. Case: the Selection Timing for the activity is Never",
    "1259": "[SR.1]3.1. Exit Select Children Process",
    "897": "[SR.1]4. Case: the Selection Timing for the activity is Once",
    "818": "[SR.1]4.05. If children have not been selected for this activity yet",
    "440": "[SR.1]4.1. If the Activity Progress Status for the activity is False Then (If the activity has not been attempted yet)",
    "773": "[SR.1]4.1.1. If the Selection Count Status for the activity is True Then",
    "889": "[SR.1]4.1.1.1. Initialize child list as an Empty ordered list",
    "870": "[SR.1]4.1.1.2. Iterate Selection Count, for the activity, times",
    "536": "[SR.1]4.1.1.2.1. Randomly select (without replacement) an activity from the children of the activity",
    "339": "[SR.1]4.1.1.2.2. Add the selected activity to the child list, retaining the original (from the activity) relative order of activities",
    "774": "[SR.1]4.1.1.3. Set Available Children for the activity to the child list",
    "1260": "[SR.1]4.2. Exit Select Children Process",
    "739": "[SR.1]5. Case: the Selection Timing for the activity is On Each New Attempt",
    "898": "[SR.1]5.1. Exit Select Children Process (Undefined behavior)",
    "842": "[SR.1]6. Exit Select Children Process (Undefined timing attribute)",
    "537": "[SR.2]1. If the activity does not have children Then (Cannot apply randomization to a leaf activity)",
    "1203": "[SR.2]1.1. Exit Randomize Children Process",
    "155": "[SR.2]2. If Activity is Suspended for the activity is True Or the Activity is Activefor the activity is True Then (Cannot apply randomization to a suspended or active activity)",
    "1204": "[SR.2]2.1. Exit Randomize Children Process",
    "854": "[SR.2]3. Case: the Randomization Timing for the activity is Never",
    "1205": "[SR.2]3.1. Exit Randomize Children Process",
    "861": "[SR.2]4. Case: the Randomization Timing for the activity is Once",
    "783": "[SR.2]4.05. If the activity's children have not already been randomized",
    "441": "[SR.2]4.1. If the Activity Progress Status for the activity is False Then (If the activity has not been attempted yet)",
    "862": "[SR.2]4.1.1. If Randomize Children for the activity is True Then",
    "568": "[SR.2]4.1.1.1. Randomly reorder the activities contained in Available Children for the activity",
    "1206": "[SR.2]4.2. Exit Randomize Children Process",
    "696": "[SR.2]5. Case: the Randomization Timing for the activity is On Each New Attempt",
    "876": "[SR.2]5.1. If Randomize Children for the activity is True Then",
    "586": "[SR.2]5.1.1. Randomly reorder the activities contained in Available Children for the activity",
    "1207": "[SR.2]5.2. Exit Randomize Children Process",
    "833": "[SR.2]6. Exit Randomize Children Process Undefined timing attribute",
    "249": "[TB.2.1]1. Form the activity path as the ordered series of activities from the root of the activity tree to the parent of the Current Activity, inclusive",
    "1225": "[TB.2.1]2. Initialize exit target to Null",
    "307": "[TB.2.1]3. For each activity in the activity path (Evaluate all exit rules along the active path, starting at the root of the activity tree)",
    "553": "[TB.2.1]3.1. Apply the Sequencing Rules Check Process to the activity and the set of Exit actions",
    "740": "[TB.2.1]3.2. If the Sequencing Rules Check Process does not return Nil Then",
    "415": "[TB.2.1]3.2.1. Set the exit target to the activity (Stop at the first activity that has an exit rule evaluating to true)",
    "1544": "[TB.2.1]3.2.2. Break For",
    "1208": "[TB.2.1]4. If exit target is Not Null Then",
    "352": "[TB.2.1]4.1. Apply the Terminate Descendent Attempts Process to the exit target (End the current attempt on all active descendents)",
    "466": "[TB.2.1]4.2. Apply the End Attempt Process to the exit target (End the current attempt on the 'exiting' activity)",
    "348": "[TB.2.1]4.3. Set the Current Activity to the exit target (Move the current activity to the activity that identified for termination)",
    "966": "[TB.2.1]5. Exit Sequencing Exit Action Rules Subprocess",
    "340": "[TB.2.2]1. If Activity is Suspended for the Current Activity is True Then (Do not apply post condition rules to a suspended activity)",
    "899": "[TB.2.2]1.1. Exit Sequencing Post Condition Rules Subprocess",
    "190": "[TB.2.2]2. Apply the Sequencing Rules Check Process to the Current Activity and the set of Post Condition actions (Apply the post condition rules to the current activity)",
    "766": "[TB.2.2]3. If the Sequencing Rules Check Process does not return Nil Then",
    "587": "[TB.2.2]3.1. If the Sequencing Rules Check Process returned Retry, Continue, Or Previous Then",
    "47": "[TB.2.2]3.1.1. Exit Sequencing Post Condition Rules Subprocess (Sequencing Request: the value returned by the Sequencing Rules Check Process; Termination Request: n/a) (Attempt to override any pending sequencing request with this one)",
    "621": "[TB.2.2]3.2. If the Sequencing Rules Check Process returned Exit Parent Or Exit All Then",
    "85": "[TB.2.2]3.2.1. Exit Sequencing Post Condition Rules Subprocess (Sequencing Request: n/a; Termination Request: the value returned by the Sequencing Rules Check Process) (Terminate the appropriate activity(s))",
    "752": "[TB.2.2]3.3. If the Sequencing Rules Check Process returned Retry All Then",
    "30": "[TB.2.2]3.3.1. Exit Sequencing Post Condition Rules Subprocess (Termination Request: Exit All; Sequencing Request: Retry) (Terminate all active activities and move the current activity to the root of the activity tree; then perform an 'in-process' start)",
    "484": "[TB.2.2]4. Exit Sequencing Post Condition Rules Subprocess (Sequencing Request: n/a; Sequencing Request; n/a)",
    "367": "[TB.2.3]1. If the Current Activity is Not Defined Then (If the sequencing session has not begun, there is nothing to terminate)",
    "381": "[TB.2.3]1.1. Exit Termination Request Process (Termination Request: Not Valid; Sequencing Request: n/a; Exception: TB.2.3-1)",
    "88": "[TB.2.3]2. If (the termination request is Exit Or Abandon) And Activity is Active for the Current Activity is False Then (If the current activity has already been terminated, there is nothing to terminate)",
    "382": "[TB.2.3]2.1. Exit Termination Request Process (Termination Request: Not Valid; Sequencing Request: n/a; Exception: TB.2.3-2)",
    "1157": "[TB.2.3]3. Case: termination request is Exit",
    "383": "[TB.2.3]3.1. Apply the End Attempt Process to the Current Activity  (Ensure the state of the current activity is up to date)",
    "241": "[TB.2.3]3.2. Apply the Sequencing Exit Action Rules Subprocess to the Current Activity (Check if any of the current activity's ancestors need to terminate)",
    "1641": "[TB.2.3]3.3. Repeat",
    "1112": "[TB.2.3]3.3.1. Set the processed exit to False",
    "588": "[TB.2.3]3.3.2. Apply the Sequencing Post Condition Rules Subprocess to the Current Activity (",
    "473": "[TB.2.3]3.3.3. If the Sequencing Post Condition Rule Subprocess returned a termination request of Exit All Then",
    "908": "[TB.2.3]3.3.3.1. Change the termination request to Exit All",
    "675": "[TB.2.3]3.3.3.2. Break to the next Case (Process an Exit All Termination Request)",
    "53": "[TB.2.3]3.3.4. If the Sequencing Post Condition Rule Subprocess returned a termination request of Exit Parent Then (If we exit the parent of the current activity, move the current activity to the parent of the current activity.)",
    "281": "[TB.2.3]3.3.4.1. If the Current Activity is Not the root of the activity tree Then (The root of the activity tree does not have a parent to exit)",
    "676": "[TB.2.3]3.3.4.1.1. Set the Current Activity to the parent of the Current Activity",
    "775": "[TB.2.3]3.3.4.1.2. Apply the End Attempt Process to the Current Activity",
    "494": "[TB.2.3]3.3.4.1.3. Set processed exit to True (Need to evaluate post conditions on the new current activity)",
    "1598": "[TB.2.3]3.3.4.2. Else",
    "355": "[TB.2.3]3.3.4.2.1. Exit Termination Request Process (Termination Request: Not Valid; Sequencing Request: n/a; Exception: TB.2.3-4)",
    "1642": "[TB.2.3]3.3.5. Else",
    "8": "[TB.2.3]3.3.5.1. If the Current Activity is the Root of the Activity Tree And the sequencing request returned by the Sequencing Post Condition Rule Subprocess is Not Retry Then If the attempt on the root of the Activity Tree is ending without a Retry, the Sequencing Session also ends",
    "404": "[TB.2.3]3.3.5.1.1. Exit Termination Request Process (Termination Request: Valid; Sequencing Request: Exit; Exception: n/a",
    "54": "[TB.2.3]3.6. Exit Termination Request Process (Termination Request: Valid; Sequencing Request: is the sequencing request returned by the Sequencing Post Condition Rule Subprocess, if one exists, otherwise n/a; Exception: n/a)",
    "1077": "[TB.2.3]4. Case: termination request is Exit All",
    "819": "[TB.2.3]4.1.1. Apply the End Attempt Process to the Current Activity",
    "238": "[TB.2.3]4.1.If Activity is Active for the Current Activity is True Then (Has the completion subprocess and rollup been applied to the current activity yet?)",
    "589": "[TB.2.3]4.2. Apply the Terminate Descendent Attempts Process to the root of the activity tree",
    "741": "[TB.2.3]4.3. Apply the End Attempt Process to the root of the activity tree",
    "353": "[TB.2.3]4.4. Set the Current Activity to the root of the activity tree (Move the current activity to the root of the activity tree)",
    "3": "[TB.2.3]4.5. Exit Termination Request Process (Termination Request: Valid; Sequencing Request: is the sequencing request returned by the Sequencing Post Condition Rule Subprocess, if one exists, otherwise an Exit sequencing request; Exception: n/a) Inform the sequencer that the sequencing session has ended",
    "451": "[TB.2.3]4.5.1 Sequencing Request: is the sequencing request returned by the Sequencing Post Condition Rule Subprocess",
    "1036": "[TB.2.3]4.5.2 Otherwise an Exit sequencing request",
    "1014": "[TB.2.3]5. Case: termination request is Suspend All",
    "45": "[TB.2.3]5.1. If (the Activity is Active for the Current Activity is True) Or (the Activity is Suspended for the Current Activity is True) Then (If the current activity is active or already suspended, suspend it and all of its descendents)",
    "510": "[TB.2.3]5.1.0.1. Apply the End Attempt Process to the Current Activity upon Return To LMS (Not in p-code)",
    "1096": "[TB.2.3]5.1.1. Apply the Overall Rollup Process",
    "855": "[TB.2.3]5.1.1. Set the Suspended Activity to the Current Activity",
    "856": "[TB.2.3]5.1.2. Set the Suspended Activity to the Current Activity",
    "1693": "[TB.2.3]5.2. Else",
    "258": "[TB.2.3]5.2.1. If the Current Activity is not the root of the activity tree Then (Make sure the current activity is not the root of the activity tree)",
    "677": "[TB.2.3]5.2.1.1. Set the Suspended Activity to the parent of the Current Activity",
    "1643": "[TB.2.3]5.2.2. Else",
    "263": "[TB.2.3]5.2.2.1. Exit Termination Request Process (Termination Request: Not Valid; Sequencing Request: n/a; Exception: TB.2.3-3) (Nothing to suspend)",
    "273": "[TB.2.3]5.3. Form the activity path as the ordered series of all activities from the Suspended Activity to the root of the activity tree, inclusive",
    "1097": "[TB.2.3]5.4. If the activity path is Empty Then",
    "274": "[TB.2.3]5.4.1. Exit Termination Request Process (Termination Request: Not Valid; Sequencing Request: n/a; Exception: TB.2.3-5) (Nothing to suspend)",
    "1015": "[TB.2.3]5.5. For each activity in the activity path",
    "640": "[TB.2.3]5.5.1. Set Activity is Active for the activity to False (Activity Identifier=",
    "857": "[TB.2.3]5.5.2. Set Activity is Suspended for the activity to True",
    "354": "[TB.2.3]5.6. Set the Current Activity to the root of the activity tree (Move the current activity to the root of the activity tree)",
    "160": "[TB.2.3]5.7. Exit Termination Request Process (Termination Request: Valid; Sequencing Request: Exit; Exception: n/a) Inform the sequencer that the sequencing session has ended",
    "1098": "[TB.2.3]6. Case: termination request is Abandon",
    "810": "[TB.2.3]6.1. Set Activity is Active for the Current Activity to False",
    "459": "[TB.2.3]6.2. Exit Termination Request Process (Termination Request: Valid; Sequencing Request: n/a; Exception: n/a)",
    "1016": "[TB.2.3]7. Case: termination request is Abandon All",
    "282": "[TB.2.3]7.1. Form the activity path as the ordered series of all activities from the Current Activity to the root of the activity tree, inclusive",
    "1099": "[TB.2.3]7.2. If the activity path is Empty Then",
    "283": "[TB.2.3]7.2.1. Exit Termination Request Process (Termination Request: Not Valid; Sequencing Request: n/a; Exception: TB.2.3-6) Nothing to abandon",
    "1017": "[TB.2.3]7.3. For each activity in the activity path",
    "871": "[TB.2.3]7.3.1. Set Activity is Active for the activity to False",
    "360": "[TB.2.3]7.4. Set the Current Activity to the root of the activity tree Move the current activity to the root of the activity tree",
    "165": "[TB.2.3]7.5.Exit Termination Request Process (Termination Request: Valid; Sequencing Request: Exit; Exception: n/a) Inform the sequencer that the sequencing session has ended",
    "255": "[TB.2.3]8. Exit Termination Request Process (Termination Request: Not Valid; Sequencing Request: n/a; Exception: TB.2.3-7) Undefined termination request",
    "543": "[UP.1] 4 - 9 Note - duration and time based limit controls are not evaluated in this implementation",
    "384": "[UP.1]1. If Tracked for the activity is False Then (If the activity is not tracked, its limit conditions cannot be violated)",
    "296": "[UP.1]1.1. Exit Limit Conditions Check Process (Limit Condition Violated: False) (Activity is not tracked, no limit conditions can be violated)",
    "144": "[UP.1]2. If the Activity is Active for the activity is True Or the Activity is Suspended for the activity is True Then (Only need to check activities that will begin a new attempt)",
    "688": "[UP.1]2.1. Exit Limit Conditions Check Process (Limit Condition Violated: False)",
    "715": "[UP.1]3. If the Limit Condition Attempt Control for the activity is True Then",
    "89": "[UP.1]3.1. If the Activity Progress Status for the activity is True And the Activity Attempt Count for the activity is greater than or equal (>=) to the Limit Condition Attempt Limit for the activity Then",
    "429": "[UP.1]3.1.1. Exit Limit Conditions Check Process (Limit Condition Violated: True) (Limit conditions have been violated)",
    "326": "[UP.2.1]1. Initialize rule condition bag as an Empty collection (This is used to keep track of the evaluation of the rule's conditions)",
    "742": "[UP.2.1]2. For each Rule Condition for the Sequencing Rule for the activity",
    "102": "[UP.2.1]2.1. Evaluate the rule condition by applying the appropriate tracking information for the activity to the Rule Condition (Evaluate each condition against the activity's tracking information)",
    "704": "[UP.2.1]2.2. If the Rule Condition Operator for the Rule Condition is Not Then",
    "667": "[UP.2.1]2.2.1. Negate the rule condition (Negating 'unknown' results in 'unknown')",
    "291": "[UP.2.1]2.3. Add the value of rule condition to the rule condition bag (Add the evaluation of this condition to the set of evaluated conditions)",
    "375": "[UP.2.1]3. If the rule condition bag is Empty Then (If there are no defined conditions for the rule, the rule does not apply)",
    "614": "[UP.2.1]3.1. Exit Sequencing Rule Check Subprocess (Result: Unknown) (No rule conditions)",
    "62": "[UP.2.1]4. Apply the Rule Combination for the Sequencing Rule to the rule condition bag to produce a single combined rule evaluation ('And' or 'Or' the set of evaluated conditions, based on the sequencing rule definition)",
    "622": "[UP.2.1]5. Exit Sequencing Rule Check Subprocess (Result: the value of rule evaluation) ",
    "304": "[UP.2]1. If the activity includes Sequencing Rules with any of the specified Rule Actions Then (Make sure the activity has rules to evaluate)",
    "191": "[UP.2]1.1. Initialize rules list by selecting the set of Sequencing Rules for the activity that have any of the specified Rule Actions (maintaining original rule ordering",
    "1209": "[UP.2]1.2. For each rule in the rules list",
    "416": "[UP.2]1.2.1. Apply the Sequencing Rule Check Subprocess to the activity and the rule (Evaluate each rule, one at a time)",
    "796": "[UP.2]1.2.2. If the Sequencing Rule Check Subprocess returns True Then",
    "211": "[UP.2]1.2.2.1. Exit Sequencing Rules Check Process (Action: Rule Action for the rule) (Stop at the first rule that evaluates to true - perform the associated action)",
    "460": "[UP.2]2. Exit Sequencing Rules Check Process (Action: Nil) (No rules evaluated to true - do not perform any action)",
    "689": "[UP.3]1. Find the activity that is the common ancestor of the Current Activity (",
    "152": "[UP.3]2. Form the activity path as the ordered series of activities from the Current Activity to the common ancestor, exclusive of the Current Activity and the common ancestor (",
    "526": "[UP.3]3. If the activity path is Not Empty Then (There are some activities that need to be terminated)",
    "1057": "[UP.3]3.1. For each activity in the activity path",
    "474": "[UP.3]3.1.1. Apply the End Attempt Process to the activity (End the current attempt on each activity) Activity-",
    "743": "[UP.3]3.a Rollup the rollup set accumulated during the EndAttempt processes",
    "1018": "[UP.3]4. Exit Terminate Descendent Attempts Process",
    "1503": "[UP.4]1. If the activity (",
    "1019": "[UP.4]1.1. If Tracked for the activity is True Then",
    "863": "[UP.4]1.1.05 Transfer data from the RTE to the sequencing engine",
    "312": "[UP.4]1.1.1.  If the Activity is Suspended for the activity is False Then (The sequencer will not affect the state of suspended activities)",
    "284": "[UP.4]1.1.1.1. If the Completion Set by Content for the activity is False Then (Should the sequencer set the completion status of the activity? )",
    "78": "[UP.4]1.1.1.1.1. If the Attempt Progress Status for the activity is False  And Completion Status was not changed during runtime  Then (Did the content inform the sequencer of the activity's completion status?)",
    "245": "[UP.4]1.1.1.1.1. If the Attempt Progress Status for the activity is False Then (Did the content inform the sequencer of the activity's completion status?)",
    "744": "[UP.4]1.1.1.1.1.1. Set the Attempt Progress Status for the activity to True",
    "716": "[UP.4]1.1.1.1.1.2. Set the Attempt Completion Status for the activity to True",
    "297": "[UP.4]1.1.1.2.  If the Objective Set by Content for the activity is False Then (Should the sequencer set the objective status of the activity?)",
    "864": "[UP.4]1.1.1.2.1. For all objectives associated with the activity",
    "596": "[UP.4]1.1.1.2.1. Get the primary objective (For all objectives associated with the activity)",
    "623": "[UP.4]1.1.1.2.1.1. If the Objective Contributes to Rollup for the objective is True Then",
    "64": "[UP.4]1.1.1.2.1.1.1. If the Objective Progress Status for the objective is False And Success Status was not changed during runtime Then (Did the content inform the sequencer of the activity's rolled-up objective status?)",
    "192": "[UP.4]1.1.1.2.1.1.1. If the Objective Progress Status for the objective is False Then (Did the content inform the sequencer of the activity's rolled-up objective status?)",
    "668": "[UP.4]1.1.1.2.1.1.1.1. Set the Objective Progress Status for the objective to True",
    "658": "[UP.4]1.1.1.2.1.1.1.2. Set the Objective Satisfied Status for the objective to True",
    "1226": "[UP.4]2. Else (The activity has children)",
    "109": "[UP.4]2.1. If the activity includes any child activity whose Activity is Suspended attribute is True Then (The suspended status of the parent is dependent on the suspended status of its children)",
    "834": "[UP.4]2.1.1. Set the Activity is Suspended for the activity to True",
    "1723": "[UP.4]2.2. Else",
    "820": "[UP.4]2.2.1. Set the Activity is Suspended for the activity to False",
    "462": "[UP.4]3. Set the Activity is Active for the activity to False (The current attempt on this the activity has ended)",
    "250": "[UP.4]4. Apply the Overall Rollup Process to the activity (Ensure that any status change to this activity is propagated through the entire activity tree)",
    "235": "[UP.4]4.5 Find all the activities that read the global objectives written by this activity and invoke the overall rollup process on them (not in pseudo code)",
    "527": "[UP.4]4.a. Performance Optimization - Deferring rollup to parent process to ensure minimal rollup set.",
    "457": "[UP.4]4.b. Apply the Overall Rollup Process to the parents of activities affected by write maps (not in pseudo code)",
    "218": "[UP.4]4.c. Performance Optimization - Deferring rollup or activities affected by write maps to parent process to ensure minimal rollup set. (not in pseudo code)",
    "1310": "[UP.4]5. Exit End Attempt Subprocess",
    "313": "[UP.5]1.Apply the Sequencing Rules Check Process to the activity and the Disabled sequencing rules (Make sure the activity is not disabled)",
    "784": "[UP.5]2. If the Sequencing Rules Check Process does not return Nil Then",
    "722": "[UP.5]2.1. Exit Check Activity Process (Result: True) (Activity is Disabled)",
    "396": "[UP.5]3. Apply the Limit Conditions Check Process to the activity (Make the activity does not violate any limit condition)",
    "865": "[UP.5]4. If the Limit Conditions Check Process returns True Then",
    "615": "[UP.5]4.1. Exit Check Activity Process (Result: True) (Limit Condition Has Been Violated)",
    "753": "[UP.5]5. Exit Check Activity Process (Result: False) (Activity is allowed)",
    "292": "[[NB.2.1]8.1.1. If the Activity is Active for the Current Activity is True Then (Make sure the current activity has not already been terminated)",
    "669": "[[SB.2.1]4.3.1.1. If Sequencing Control Forward Only for the activity is True Then",
    "505": "activity.HasChildActivitiesDeliverableViaFlow = false.  Setting possibleNavRequest.WillNeverSucceed = true.",
    "275": "activity.HasSeqRulesRelevantToChoice = false and possibleNavRequest.WillNeverSucceed = false.  Setting possibleNavRequest.WillAlwaysSucceed = true.",
    "356": "activity.IsDeliverable = false and activity.GetSequencingControlFlow = false.  Setting possibleNavRequest.WillNeverSucceed = true.",
    "1504": "controlChoiceExitIsUsed = ",
    "549": "controlChoiceExitIsUsed = true.  Setting WillAlwaysSucceed = false for all possible nav. requests.",
    "1564": "failed to pass logEntry",
    "1759": "false",
    "942": "is the root, therefore the common ancestor of activities ",
    "1762": "null",
    "1763": "true"
};
